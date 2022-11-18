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
    
"""

import pandas as pd
import pymunk
from pymunk.vec2d import Vec2d
import math

ZOOM_LEVELS = 5

class Dot:
    def __init__(self, data_idx: int, radius: float, pos: Vec2d) -> None:
        self.data_idx = data_idx
        self.radius = radius
        self.body = pymunk.Body(math.pi * radius**2)
        self.body.position = pos
        self.shape = pymunk.Circle(self.body, radius)
        self.shape.elasticity = 0.0
        self.shape.friction = 0.0
        
    def add_to_space(self, space: pymunk.Space) -> None:
        space.add(self.body, self.shape)
    


def coalesce(dots):
    pass

def main():
    # Load movies.csv data from /public into a pandas DataFrame
    movies = pd.read_csv("public/movies.csv")

    # Load scatterplot.csv data from /public into a pandas DataFrame
    scatterplot = pd.read_csv("public/scatterplot.csv")

    # Initialize pymunk physics simulation
    space = pymunk.Space()
    space.gravity = 0, 0

    # Create a Dot object for each row in the scatterplot.csv file
    dots = []
    for i, row in scatterplot.iterrows():
        dots.append(Dot(i, row.r, Vec2d(row.x, row.y)))

    # Add all dots to the pymunk physics simulation
    for dot in dots:
        dot.add_to_space(space)

    # Perform physics simulation
    for i in range(100):
        space.step(1)

    # Update the x and y fields of the scatterplot DataFrame
    for dot in dots:
        scatterplot.loc[dot.data_idx, ['x', 'y']] = dot.body.position

    # Save the updated DataFrame back to the scatterplot.csv file
    scatterplot.to_csv("public/scatterplot.csv", index=False)


if __name__ == "__main__":
    main()