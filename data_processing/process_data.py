import pandas as pd
import re

movies = pd.read_csv("raw_data/movies.csv")
scores = pd.read_csv("raw_data/rotten_tomatoes_movies.csv")
oscars = pd.read_csv("raw_data/the_oscar_award.csv")

# Create new dataframe from movies only with movies found in scores and oscars, matching by title
movies = movies[movies["name"].isin(scores["movie_title"])]

# Get tomatometer_rating and audience_rating from scores and merge with movies
scores = scores[["movie_title", "tomatometer_rating", "audience_rating"]]
scores = scores.rename(columns={"movie_title": "name"})
movies = movies.merge(scores, on="name")

# # Get year_ceremony, ceremony, category, winner from oscars and merge with movies
# oscars = oscars[["film", "year_ceremony", "ceremony", "winner", "year_film"]]
# oscars = oscars.rename(columns={"film": "name"})

# # Remove rows with same name and year
# movies = movies.drop_duplicates(subset=["name", "year"])

# Remove unused columns
remove_fields = ["rating", "star", "writer", "director"]
movies = movies.drop(remove_fields, axis=1)

# Remove rows missing important info
movies = movies.dropna(subset=["released", "budget", "gross", "score", "year", "genre", "company"])

# Remove country from release date
movies["released"] = movies["released"].apply(lambda x: re.sub(r" \(.*\)", "", x).strip())

# Remove duplicates by name and year
movies = movies.drop_duplicates(subset=["name", "year"])
movies.set_index(["name", "year"], inplace=True)

# For each movie, set the overall oscar status
oscar_ranking = ["none", "nominee", "winner", "best_picture_nominee", "best_picture_winner"]
movies["oscar"] = "none"
def set_oscar(row):
    idx = (row["film"], row["year_film"])
    if idx in movies.index:
        if row["category"] in ["BEST MOTION PICTURE", "BEST PICTURE"]:
            label = "best_picture_winner" if row["winner"] else "best_picture_nominee"
        else:
            label = "winner" if row["winner"] else "nominee"
        if oscar_ranking.index(label) > oscar_ranking.index(movies.loc[idx, "oscar"]):
            movies.loc[idx, "oscar"] = label
oscars.apply(set_oscar, axis=1)
# Count each occurence of name and assign that count to a new column nominations
nomcounts = oscars["film"].value_counts()
movies["nominations"] = movies.index.map(lambda x: nomcounts[x[0]] if x[0] in nomcounts else 0)

# Save to csv
OUT_PATH = "../public/movies.csv"
movies.to_csv(OUT_PATH, index=True)
print("Saved to", OUT_PATH)