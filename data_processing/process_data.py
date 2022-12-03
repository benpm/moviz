import pandas as pd
import re
from datetime import datetime
from thefuzz import fuzz
from itertools import combinations, permutations
from collections import defaultdict
from rich.pretty import pprint

movies = pd.read_csv("raw_data/movies.csv")
scores = pd.read_csv("raw_data/rotten_tomatoes_movies.csv")
oscars = pd.read_csv("raw_data/the_oscar_award.csv")
cpi = pd.read_csv("../public/inflation_cpi.csv")
cpi.set_index("year", inplace=True)

# Create a new column for the RT scores which is the release year
scores = scores.dropna(subset=["original_release_date", "tomatometer_rating", "audience_rating"])
scores = scores.assign(year=scores["original_release_date"].str.extract(r"(\d{4})-\d{2}-\d{2}"))

# Rename RT movie_title to name to match with the convention for movies
scores = scores.rename(columns={"movie_title": "name"})

# Convert year column to int64
scores["year"] = scores["year"].astype("int64")
movies["year"] = movies["year"].astype("int64")

# Remove unused fields from movies
remove_fields = ["rating", "star", "writer", "director"]
movies = movies.drop(remove_fields, axis=1)

# Remove rows missing important info
movies = movies.dropna(subset=["released", "budget", "gross", "score", "genre", "company"])

# Remove all columns from scores except for tomatometer_rating and audience_rating
scores = scores[["tomatometer_rating", "audience_rating", "name", "year"]]

# Combine scores and movies by their indices
movies = movies.merge(scores, on=["name", "year"])

# Set the index for both movies and scores to be name and year
movies.set_index(["name", "year"], inplace=True)

# Remove country from release date
movies["released"] = movies["released"].apply(lambda x: re.sub(r" \(.*\)", "", x).strip())

# For each movie, set the overall oscar status
oscar_ranking = ["none", "nominee", "winner", "best_picture_nominee", "best_picture_winner"]
movies["oscar"] = "none"
wincounts = defaultdict(lambda: 0)
nomcounts = defaultdict(lambda: 0)
def set_oscar(row):
    idx = (row["film"], row["year_film"])
    if idx in movies.index:
        if row["category"] in ["BEST MOTION PICTURE", "BEST PICTURE"]:
            label = "best_picture_winner" if row["winner"] else "best_picture_nominee"
        else:
            label = "winner" if row["winner"] else "nominee"
        if oscar_ranking.index(label) > oscar_ranking.index(movies.loc[idx, "oscar"]):
            movies.loc[idx, "oscar"] = label
        nomcounts[idx] += 1
        if label in ["winner", "best_picture_winner"]:
            wincounts[idx] += 1
oscars.apply(set_oscar, axis=1)
movies["nominations"] = movies.index.map(lambda k: nomcounts[k] if k in nomcounts else 0)
movies["wins"] = movies.index.map(lambda k: wincounts[k] if k in wincounts else 0)

# Modify all release dates in the format of "YYYY" to "January 1, YYYY"
movies["released"] = movies["released"].apply(
    lambda x: re.sub(r"(\d{4})", r"January 01, \1", x) if re.match(r"^\d{4}", x) else x)

# Modify all release dates in the format of "Month YYYY" to "Month 1, YYYY"
movies["released"] = movies["released"].apply(
    lambda x: re.sub(r"(\w+) (\d{4})", r"\1 01, \2", x) if re.match(r"^\w+ \d{4}", x) else x)

# Get list of company values
companies = sorted(movies["company"].unique().tolist())

# Create mapping of company names to similar company names
company_map = {
    "Walt Disney Animation Studios": "Walt Disney Pictures",
    "Fox 2000 Pictures": "Twentieth Century Fox",
    "Metro-Goldwyn-Mayer (MGM)": "MGM",
    "Pixar Animations Studios": "Pixar",
}
for a, b in combinations(companies, 2):
    if fuzz.token_set_ratio(a, b) > 95:
        if len(a) > len(b):
            if a not in company_map:
                company_map[a] = b
        else:
            if b not in company_map:
                company_map[b] = a
pprint(company_map)
movies["company"] = movies["company"].apply(lambda x: company_map[x] if x in company_map else x)

# Remove movies with missing gross or budget
movies = movies.dropna(subset=["gross", "budget"])

# Compute profit field
movies["profit"] = movies["gross"] - movies["budget"]

# Adjust profit, gross and budget for inflation by diving by the cpi "adj" field
movies["profit_adj"] = movies["profit"] // movies.index.map(lambda k: cpi.loc[k[1], "adj"])
movies["gross_adj"] = movies["gross"] // movies.index.map(lambda k: cpi.loc[k[1], "adj"])
movies["budget_adj"] = movies["budget"] // movies.index.map(lambda k: cpi.loc[k[1], "adj"])

# Save to csv
OUT_PATH = "../public/movies.csv"
movies.to_csv(OUT_PATH, index=True)
print("Saved to", OUT_PATH)