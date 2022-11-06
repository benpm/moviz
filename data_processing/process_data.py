import pandas as pd

movies = pd.read_csv("raw_data/movies.csv")
scores = pd.read_csv("raw_data/rotten_tomatoes_movies.csv")
oscars = pd.read_csv("raw_data/the_oscar_award.csv")

# Create new dataframe from movies only with movies found in scores and oscars, matching by title
movies = movies[movies["name"].isin(scores["movie_title"])]

# Get tomatometer_rating and audience_rating from scores and merge with movies
scores = scores[["movie_title", "tomatometer_rating", "audience_rating"]]
scores = scores.rename(columns={"movie_title": "name"})
movies = movies.merge(scores, on="name")

# Get year_ceremony, ceremony, category, winner from oscars and merge with movies
oscars = oscars[["film", "year_ceremony", "ceremony", "winner", "year_film"]]
oscars = oscars.rename(columns={"film": "name"})

# Count each occurence of name and assign that count to a new column nominations
nomcounts = oscars["name"].value_counts()
movies["nominations"] = movies["name"].apply(lambda x: nomcounts[x] if x in nomcounts else 0)
temp = oscars.drop_duplicates(subset=["name", "year_film"])
temp = temp.set_index(["name", "year_film"])
print(temp)
movies["year_ceremony"] = movies["name"].apply(lambda x: temp.loc[x].year_ceremony if x in temp.index else None)

# Remove rows with same name and year
movies = movies.drop_duplicates(subset=["name", "year"])

# Remove unused columns
# remove_fields = ["rating", "star", "writer", "director", "category"]
# movies = movies.drop(remove_fields, axis=1)

# Save to csv
movies.to_csv("movies.csv", index=False)