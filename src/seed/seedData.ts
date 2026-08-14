/**
 * Development/demo seed data only. Kept isolated from application logic
 * so it can be trivially swapped, extended, or removed.
 */

export interface SeedMedia {
  title: string;
  type: "movie" | "series";
  poster: string;
  description: string;
  genres: string[];
  countries: string[];
  industry?: string;
  releaseYear?: number;
  startYear?: number;
  endYear?: number | null;
  ongoing?: boolean;
}

const p = (seed: string) => `https://picsum.photos/seed/${seed}/500/750`;

export const seedMedia: SeedMedia[] = [
  // Marvel / Superhero
  { title: "Iron Man", type: "movie", poster: p("iron-man"), description: "A billionaire engineer builds a powered suit of armor to fight the evils of the world.", genres: ["Action", "Superhero", "Sci-Fi"], countries: ["USA"], industry: "Hollywood", releaseYear: 2008 },
  { title: "Captain America: The First Avenger", type: "movie", poster: p("cap-america"), description: "A frail young man is transformed into a super-soldier during World War II.", genres: ["Action", "Superhero", "War"], countries: ["USA"], industry: "Hollywood", releaseYear: 2011 },
  { title: "The Avengers", type: "movie", poster: p("avengers"), description: "Earth's mightiest heroes assemble to stop an alien invasion led by Loki.", genres: ["Action", "Superhero", "Sci-Fi"], countries: ["USA"], industry: "Hollywood", releaseYear: 2012 },
  { title: "Guardians of the Galaxy", type: "movie", poster: p("guardians"), description: "A group of misfit outlaws band together to protect the galaxy from a fanatical warlord.", genres: ["Action", "Adventure", "Sci-Fi", "Comedy"], countries: ["USA"], industry: "Hollywood", releaseYear: 2014 },
  { title: "Black Panther", type: "movie", poster: p("black-panther"), description: "The new king of Wakanda must defend his nation from a vengeful outsider.", genres: ["Action", "Superhero", "Drama"], countries: ["USA"], industry: "Hollywood", releaseYear: 2018 },
  { title: "WandaVision", type: "series", poster: p("wandavision"), description: "A superpowered couple begin to suspect their sitcom-perfect lives aren't what they seem.", genres: ["Superhero", "Mystery", "Drama"], countries: ["USA"], industry: "Hollywood", startYear: 2021, endYear: 2021 },
  { title: "Loki", type: "series", poster: p("loki"), description: "The God of Mischief steps out of his brother's shadow into a new adventure across time.", genres: ["Superhero", "Sci-Fi", "Fantasy"], countries: ["USA"], industry: "Hollywood", startYear: 2021, ongoing: true },
  { title: "Daredevil", type: "series", poster: p("daredevil"), description: "A blind lawyer by day becomes a masked vigilante protecting Hell's Kitchen by night.", genres: ["Action", "Crime", "Drama"], countries: ["USA"], industry: "Hollywood", startYear: 2015, endYear: 2018 },

  // Hollywood — assorted genres
  { title: "Inception", type: "movie", poster: p("inception"), description: "A thief who steals corporate secrets through dream-sharing is given a chance at redemption.", genres: ["Sci-Fi", "Thriller", "Action"], countries: ["USA"], industry: "Hollywood", releaseYear: 2010 },
  { title: "The Grand Budapest Hotel", type: "movie", poster: p("budapest"), description: "A concierge and his protégé become embroiled in a theft and murder mystery at a famous hotel.", genres: ["Comedy", "Drama"], countries: ["USA"], industry: "Hollywood", releaseYear: 2014 },
  { title: "A Quiet Place", type: "movie", poster: p("quiet-place"), description: "A family must live in silence to avoid attracting creatures that hunt by sound.", genres: ["Horror", "Thriller"], countries: ["USA"], industry: "Hollywood", releaseYear: 2018 },
  { title: "Knives Out", type: "movie", poster: p("knives-out"), description: "A detective investigates the death of a wealthy crime novelist surrounded by a dysfunctional family.", genres: ["Mystery", "Comedy", "Crime"], countries: ["USA"], industry: "Hollywood", releaseYear: 2019 },
  { title: "Interstellar", type: "movie", poster: p("interstellar"), description: "A team of explorers travel through a wormhole in search of a new home for humanity.", genres: ["Sci-Fi", "Drama", "Adventure"], countries: ["USA"], industry: "Hollywood", releaseYear: 2014 },
  { title: "Everything Everywhere All at Once", type: "movie", poster: p("eeaao"), description: "An overworked laundromat owner discovers she must connect with parallel universe versions of herself.", genres: ["Sci-Fi", "Comedy", "Action"], countries: ["USA"], industry: "Hollywood", releaseYear: 2022 },
  { title: "Breaking Bad", type: "series", poster: p("breaking-bad"), description: "A chemistry teacher turned methamphetamine manufacturer navigates the criminal underworld.", genres: ["Crime", "Drama", "Thriller"], countries: ["USA"], industry: "Hollywood", startYear: 2008, endYear: 2013 },
  { title: "Stranger Things", type: "series", poster: p("stranger-things"), description: "A group of kids uncover supernatural mysteries in their small town after a friend vanishes.", genres: ["Sci-Fi", "Horror", "Drama"], countries: ["USA"], industry: "Hollywood", startYear: 2016, ongoing: true },
  { title: "The Bear", type: "series", poster: p("the-bear"), description: "A young chef returns home to run his family's sandwich shop after a family tragedy.", genres: ["Drama", "Comedy"], countries: ["USA"], industry: "Hollywood", startYear: 2022, ongoing: true },
  { title: "Toy Story", type: "movie", poster: p("toy-story"), description: "A cowboy doll is threatened when a new spaceman toy supplants him as top toy.", genres: ["Animation", "Family", "Comedy"], countries: ["USA"], industry: "Hollywood", releaseYear: 1995 },

  // Bollywood
  { title: "3 Idiots", type: "movie", poster: p("3-idiots"), description: "Two friends search for their long-lost college companion, revisiting their engineering school days.", genres: ["Comedy", "Drama"], countries: ["India"], industry: "Bollywood", releaseYear: 2009 },
  { title: "Dangal", type: "movie", poster: p("dangal"), description: "A former wrestler trains his daughters to become world-class wrestling champions.", genres: ["Drama", "Sports", "Biography"], countries: ["India"], industry: "Bollywood", releaseYear: 2016 },
  { title: "Gully Boy", type: "movie", poster: p("gully-boy"), description: "A street rapper from Mumbai's slums chases his dream of making it big in hip hop.", genres: ["Drama", "Musical"], countries: ["India"], industry: "Bollywood", releaseYear: 2019 },
  { title: "Zindagi Na Milegi Dobara", type: "movie", poster: p("znmd"), description: "Three friends embark on a road trip through Spain before one of them gets married.", genres: ["Drama", "Comedy", "Adventure"], countries: ["India"], industry: "Bollywood", releaseYear: 2011 },
  { title: "Andhadhun", type: "movie", poster: p("andhadhun"), description: "A blind pianist becomes entangled in a murder investigation after witnessing a crime he shouldn't have.", genres: ["Thriller", "Crime", "Comedy"], countries: ["India"], industry: "Bollywood", releaseYear: 2018 },
  { title: "Sacred Games", type: "series", poster: p("sacred-games"), description: "A Mumbai police officer races against time to save the city from a looming threat.", genres: ["Crime", "Thriller", "Drama"], countries: ["India"], industry: "Bollywood", startYear: 2018, endYear: 2019 },

  // South Indian cinema
  { title: "Baahubali: The Beginning", type: "movie", poster: p("baahubali"), description: "A young man raised by villagers uncovers his true royal heritage and destiny.", genres: ["Action", "Adventure", "Drama"], countries: ["India"], industry: "Tollywood", releaseYear: 2015 },
  { title: "RRR", type: "movie", poster: p("rrr"), description: "Two legendary revolutionaries join forces before their fabled fight for their homeland.", genres: ["Action", "Drama", "History"], countries: ["India"], industry: "Tollywood", releaseYear: 2022 },
  { title: "Vikram", type: "movie", poster: p("vikram"), description: "A special agent investigates a series of murders committed by a masked group.", genres: ["Action", "Thriller"], countries: ["India"], industry: "Kollywood", releaseYear: 2022 },
  { title: "Drishyam", type: "movie", poster: p("drishyam"), description: "A man goes to extreme lengths to protect his family after a crime threatens to unravel their lives.", genres: ["Thriller", "Crime", "Drama"], countries: ["India"], industry: "Mollywood", releaseYear: 2013 },
  { title: "KGF: Chapter 1", type: "movie", poster: p("kgf"), description: "A young man's rise from poverty to power in the gritty underworld of a gold mine.", genres: ["Action", "Drama"], countries: ["India"], industry: "Sandalwood", releaseYear: 2018 },

  // Korean
  { title: "Parasite", type: "movie", poster: p("parasite"), description: "A poor family schemes to become employed by a wealthy household, with dark consequences.", genres: ["Thriller", "Drama", "Comedy"], countries: ["South Korea"], industry: "Korean", releaseYear: 2019 },
  { title: "Squid Game", type: "series", poster: p("squid-game"), description: "Hundreds of cash-strapped players accept a mysterious invitation to compete in deadly children's games.", genres: ["Thriller", "Drama", "Mystery"], countries: ["South Korea"], industry: "Korean", startYear: 2021, ongoing: true },
  { title: "Crash Landing on You", type: "series", poster: p("clot"), description: "A paragliding accident strands a South Korean heiress in North Korea, where she falls for an army officer.", genres: ["Romance", "Drama", "Comedy"], countries: ["South Korea"], industry: "Korean", startYear: 2019, endYear: 2020 },
  { title: "Oldboy", type: "movie", poster: p("oldboy"), description: "A man seeks revenge after being mysteriously imprisoned for fifteen years without explanation.", genres: ["Thriller", "Mystery", "Action"], countries: ["South Korea"], industry: "Korean", releaseYear: 2003 },

  // Japanese / Chinese / British
  { title: "Your Name.", type: "movie", poster: p("your-name"), description: "Two teenagers mysteriously swap bodies, forming a bond that transcends time and space.", genres: ["Animation", "Romance", "Fantasy"], countries: ["Japan"], industry: "Japanese", releaseYear: 2016 },
  { title: "Spirited Away", type: "movie", poster: p("spirited-away"), description: "A young girl wanders into a spirit world and must find a way to free her parents and return home.", genres: ["Animation", "Fantasy", "Family"], countries: ["Japan"], industry: "Japanese", releaseYear: 2001 },
  { title: "In the Mood for Love", type: "movie", poster: p("in-the-mood"), description: "Two neighbors form a bond after discovering their spouses are having an affair with each other.", genres: ["Drama", "Romance"], countries: ["China"], industry: "Chinese", releaseYear: 2000 },
  { title: "Sherlock", type: "series", poster: p("sherlock"), description: "A modern update finds the famous detective and his companion solving crime in 21st-century London.", genres: ["Crime", "Mystery", "Drama"], countries: ["UK"], industry: "British", startYear: 2010, endYear: 2017 },
  { title: "Peaky Blinders", type: "series", poster: p("peaky-blinders"), description: "A gangster family epic set in 1900s England, centering on a gang who sew razor blades in their caps.", genres: ["Crime", "Drama"], countries: ["UK"], industry: "British", startYear: 2013, endYear: 2022 },

  // Anime
  { title: "Attack on Titan", type: "series", poster: p("aot"), description: "Humanity fights for survival against giant humanoid Titans behind massive walls.", genres: ["Anime", "Action", "Drama"], countries: ["Japan"], industry: "Japanese", startYear: 2013, endYear: 2023 },
  { title: "One Piece", type: "series", poster: p("one-piece"), description: "A young pirate with rubber powers sets sail to find the ultimate treasure and become Pirate King.", genres: ["Anime", "Adventure", "Comedy"], countries: ["Japan"], industry: "Japanese", startYear: 1999, ongoing: true },
  { title: "Naruto", type: "series", poster: p("naruto"), description: "A young ninja strives to become the leader of his village while carrying a powerful sealed spirit.", genres: ["Anime", "Action", "Adventure"], countries: ["Japan"], industry: "Japanese", startYear: 2002, endYear: 2007 },
  { title: "Demon Slayer", type: "series", poster: p("demon-slayer"), description: "A young boy becomes a demon slayer to avenge his family and cure his demon sister.", genres: ["Anime", "Action", "Fantasy"], countries: ["Japan"], industry: "Japanese", startYear: 2019, ongoing: true },
  { title: "Jujutsu Kaisen", type: "series", poster: p("jjk"), description: "A boy swallows a cursed talisman and becomes host to a powerful curse, joining a school of sorcerers.", genres: ["Anime", "Action", "Fantasy"], countries: ["Japan"], industry: "Japanese", startYear: 2020, ongoing: true },
];
