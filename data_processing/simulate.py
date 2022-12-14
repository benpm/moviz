"""
Perform physics simulations of the movies data for display in the scatterplot view.
For each zoom level, points in the scatterplot are coalesced into larger circles / groups.
The simulation is performed on the coalesced points, and the resulting positions are
stored as fields in the scatterplot.csv file, which contains references to the movies.csv
file via indices.

The rows of the scatterplot.csv file are circles. The columns are:
    - level: the zoom level the circles exists in
    - x: x position of the circle
    - y: y position of the circle
    - r: radius of the circle
    - movies: list of indices into movies.csv contained in the circle, separated by spaces
    - idx: zero-based index of the circle in its level + axes group
    
"""

import pandas as pd
import pymunk
from pymunk.vec2d import Vec2d
from datetime import datetime
from random import uniform
import math
from itertools import combinations

class Scale:
    def __init__(self, _range, _domain, conv_range=lambda _:_, conv_domain=lambda _:_):
        self.range = [r for r in _range]
        self.range_extent = self.range[1] - self.range[0]
        self.domain = _domain
        self.domain_extent = self.domain[1] - self.domain[0]
        self.conv_range = conv_range
        self.conv_domain = conv_domain
        print(f"Scale: {self.range} -> {self.domain}")

    def set_domain(self, _domain):
        self.domain = _domain
        self.domain_extent = self.domain[1] - self.domain[0]

    def __call__(self, v):
        return ((self.conv_range(v) - self.range[0]) / self.range_extent) * self.domain_extent + self.domain[0]

    def inv(self, v):
        return ((v - self.domain[0]) / self.domain_extent) * self.range_extent + self.range[0]

def extent(data: pd.DataFrame, field: str, conv: callable = lambda x: x):
    d = [conv(v) for v in data[field].to_numpy()]
    return min(d), max(d)

# Number of zoom levels. Level 0 is deepest zoom
ZOOM_LEVELS = 3
SIM_BOUNDS = ((-1000, 1000), (-300, 300))
AXES = [
    # (exclude_oscars, [x_axis, y_axis])
    (True, ["released", "score"]),
    (True, ["released", "audience_rating"]),
    (True, ["released", "tomatometer_rating"]),
    (False, ["released", "budget"]),
    (False, ["released", "gross"]),
    (False, ["released", "profit"]),
    (False, ["released", "budget_adj"]),
    (False, ["released", "gross_adj"]),
    (False, ["released", "profit_adj"]),
    (False, ["budget", "score"]),
    (False, ["budget", "audience_rating"]),
    (False, ["budget", "tomatometer_rating"]),
    (False, ["gross", "score"]),
    (False, ["gross", "audience_rating"]),
    (False, ["gross", "tomatometer_rating"]),
    (False, ["profit", "score"]),
    (False, ["profit", "audience_rating"]),
    (False, ["profit", "tomatometer_rating"]),
    (False, ["budget_adj", "score"]),
    (False, ["budget_adj", "audience_rating"]),
    (False, ["budget_adj", "tomatometer_rating"]),
    (False, ["gross_adj", "score"]),
    (False, ["gross_adj", "audience_rating"]),
    (False, ["gross_adj", "tomatometer_rating"]),
    (False, ["profit_adj", "score"]),
    (False, ["profit_adj", "audience_rating"]),
    (False, ["profit_adj", "tomatometer_rating"]),
]
# Radius of deepest zoom level dots
BASE_RADIUS = 3
# Number of steps for simulations
SIM_STEPS = 50
# Delta time per simulation step
SIM_DT = 0.01
# Distance past dot radius to consider for grouping
GROUPING_BIAS = 0.5
# Multiplier for force applied to dots
FORCE_MULTIPLIER = 0.1
# Max group radius to create a new coalesced dot for (multiplied by level)
MAX_GROUP_RADIUS = BASE_RADIUS * 1.25
# Absolute max radius
MAX_RADIUS = BASE_RADIUS * 12
# Number of threads to create simulations with
SIM_THREADS = 8
# Minimum fullness for a group to be considered for coalescing
MIN_FULLNESS = 0.65

class Dot(pymunk.Circle):
    def __init__(self, data_idx: set[int], radius: float, pos: Vec2d, space: pymunk.Space, can_coalesce: bool = True) -> None:
        body = pymunk.Body()
        body.position = pos + Vec2d(uniform(-0.5, 0.5), uniform(-0.5, 0.5))
        super().__init__(body, radius)
        self.data_idx = data_idx
        self.elasticity = 0.0
        self.friction = 0.0
        self.init_pos = pos
        self.density = 1
        self.can_coalesce = can_coalesce
        space.add(self.body, self)
    
    def pre_step(self):
        self.body.velocity *= 0.01
        self.body.apply_force_at_local_point(
            (self.body.position - self.init_pos).normalized() * FORCE_MULTIPLIER, (0, 0))

# Combine dots by finding connected groups of dots
def coalesce(space: pymunk.Space, dots: list[Dot], max_radius: float) -> tuple[pymunk.Space, list[Dot]]:
    out_space = pymunk.Space()
    out_space.threads = SIM_THREADS
    out_space.gravity = 0, 0
    out_dots = []

    grouped_dots = set()

    for source_dot in dots:
        if source_dot in grouped_dots:
            continue
        queue = [source_dot]
        group = set(queue)
        radius = 0
        center = 0

        # Attempt to construct a new group by finding near dots to source_dot
        while queue:
            dot = queue.pop()
            if not dot.can_coalesce: continue
            last_group = group.copy()

            # Find all dots within GROUPING_BIAS * radius of dot
            query = space.point_query(dot.body.position, dot.radius + GROUPING_BIAS, pymunk.ShapeFilter())
            query = [q.shape for q in query if q.shape is not dot]

            # Add all dots to group and queue if not already in a group
            added = 0
            for qdot in query:
                if qdot not in grouped_dots and qdot not in group and qdot.can_coalesce:
                    group.add(qdot)
                    queue.append(qdot)
                    added += 1
            
            # Compute new group properties
            if added > 0:
                # Find the center of mass of the group
                center = Vec2d(0, 0)
                for dot in group:
                    center += dot.body.position
                center /= len(group)

                # Find the radius of the group
                radius = 0
                for dot in group:
                    radius = max(radius, (center - dot.body.position).length + dot.radius)
            
                # Stop growing group if it is too large
                if radius > max_radius:
                    group = last_group
                    break

        # Create a new dot for the group
        if len(group) > 1:
            # Add all dots inside group radius to group, if they are not already in a group
            for qi in space.point_query(center, radius, pymunk.ShapeFilter()):
                if qi.shape not in grouped_dots and qi.shape not in group and qi.shape.can_coalesce:
                    group.add(qi.shape)

            # Reject if less than minimum fullness
            area = 0
            for dot in group:
                area += math.pi * dot.radius ** 2
            if area / (math.pi * radius ** 2) < MIN_FULLNESS:
                continue

            # Create a new dot for the group
            for dot in group:
                grouped_dots.add(dot)
            out_dots.append(Dot(set().union(*[dot.data_idx for dot in group]), radius, center, out_space))

    # Add all ungrouped dots
    if len(grouped_dots) < len(dots):
        for dot in dots:
            if dot not in grouped_dots:
                out_dots.append(Dot(dot.data_idx, dot.radius, dot.body.position, out_space, dot.can_coalesce))

    return out_space, out_dots

def simulate(sim: tuple[pymunk.Space, list[Dot]], steps: int):
    space, dots = sim
    for _ in range(steps):
        for dot in dots:
            dot.pre_step()
        space.step(SIM_DT)
    
    max_x = max(dot.body.position.x for dot in dots)
    min_x = min(dot.body.position.x for dot in dots)
    max_y = max(dot.body.position.y for dot in dots)
    min_y = min(dot.body.position.y for dot in dots)
    print(f"Simulated {len(dots)} dots in {steps} steps bounds=({min_x:.2f}, {max_x:.2f}), ({min_y:.2f}, {max_y:.2f})")

def main():
    parse_date = lambda x: datetime.strptime(x, "%B %d, %Y")
    log_safe = lambda x: math.log10(x) if x != 0 else 0

    # Load movies.csv data from /public into a pandas DataFrame
    movies = pd.read_csv("../public/movies.csv")

    scales = {
        "released": Scale(extent(movies, "released", parse_date), SIM_BOUNDS[0], conv_range=parse_date, conv_domain=lambda x: x.strftime("%B %d, %Y")),
        "budget": Scale(extent(movies, "budget", log_safe), SIM_BOUNDS[0], conv_range=log_safe),
        "gross": Scale(extent(movies, "gross", log_safe), SIM_BOUNDS[0], conv_range=log_safe),
        "profit": Scale(extent(movies, "profit"), SIM_BOUNDS[0]),
        "budget_adj": Scale(extent(movies, "budget_adj", log_safe), SIM_BOUNDS[0], conv_range=log_safe),
        "gross_adj": Scale(extent(movies, "gross_adj", log_safe), SIM_BOUNDS[0], conv_range=log_safe),
        "profit_adj": Scale(extent(movies, "profit_adj"), SIM_BOUNDS[0]),
        "score": Scale((0, 10), SIM_BOUNDS[0]),
        "nominations": Scale(extent(movies, "nominations"), SIM_BOUNDS[1]),
        "tomatometer_rating": Scale((0, 100), SIM_BOUNDS[1]),
        "audience_rating": Scale((0, 100), SIM_BOUNDS[1])
    }

    # Load scatterplot.csv data from /public into a pandas DataFrame
    df = pd.DataFrame(columns=["lvl", "x_axis", "y_axis", "x", "y", "r", "movies"])
    
    # Initialize pymunk physics simulation
    space = pymunk.Space()
    space.gravity = 0, 0

    for exclude_oscars, (x_axis, y_axis) in AXES:
        print(f"\nsimulating on {x_axis} / {y_axis}")

        # Initialize zoom level 0 space
        lvls: list[tuple[pymunk.Space, list[Dot]]] = []
        space = pymunk.Space(True)
        space.threads = SIM_THREADS
        space.gravity = 0, 0
        lvls.append((space, []))
        
        # Zoom level 0 (deepest): create a Dot object for each row in the scatterplot.csv file
        for i, row in movies.iterrows():
            xscale = scales[x_axis]
            xscale.set_domain(SIM_BOUNDS[0])
            yscale = scales[y_axis]
            yscale.set_domain(SIM_BOUNDS[1])
            lvls[0][1].append(Dot(set([i]), BASE_RADIUS,
                Vec2d(xscale(row[x_axis]), yscale(row[y_axis])), space,
                not (exclude_oscars and row["nominations"] > 0)))

        # Run the simulation for zoom level 0
        print(f"running initial simulation of {len(lvls[0][1])} dots...")
        simulate(lvls[0], SIM_STEPS)
        
        # Progressively coalesce the dots into larger circles, and run the simulation for each level
        for lvl in range(1, ZOOM_LEVELS):
            print(f"coalescing dots for zoom level {lvl}...")
            lvls.append(coalesce(*lvls[lvl - 1], max_radius=min(MAX_RADIUS, BASE_RADIUS + MAX_GROUP_RADIUS * lvl)))
            print(f"running lvl {lvl} simulation of {len(lvls[lvl][1])} dots...")
            simulate(lvls[lvl], SIM_STEPS)
        
        # For each dot, insert a new row into the dataframe
        print("inserting data into dataframe...")
        for lvl, (space, dots) in enumerate(lvls):
            df = pd.concat([df, pd.DataFrame([
                [lvl, x_axis, y_axis, dot.body.position.x, dot.body.position.y, dot.radius,
                    " ".join([str(i) for i in list(dot.data_idx)]), idx]
                for idx, dot in enumerate(dots)
            ], columns=["lvl", "x_axis", "y_axis", "x", "y", "r", "movies", "idx"])])
        print(f"new dataframe length is {len(df)}")
                    
    # Save the generated DataFrame to the scatterplot.csv file
    print("saving dataframe to file...")
    df["idx"] = df["idx"].astype(int)
    df.to_csv("../public/scatterplot.csv", index=False, float_format="%.2f")

# Just load public/scatterplot.csv and generate scatterplot.h5
def convert():
    df = pd.read_csv("../public/scatterplot.csv")
    df.to_parquet("../public/scatterplot.parquet", index=False)

if __name__ == "__main__":
    from sys import argv
    if argv[-1] == "convert":
        convert()
    else:
        main()