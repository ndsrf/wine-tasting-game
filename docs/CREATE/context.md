Think how to create a web application to run wine tasting sessions for people who don't know much about wine. There will be a director who organises the game, and multiple players. The director requires login (with username and password, or a Google account), the players do not require login. The director creates and configures a game that will provide a unique code the players can use to join the game. The target is for players to guess correctly as many characteristics of each as possible (each right guess will give points). Whoever has more points at the end of the game, wins. The application will have the following features:

1. The director requieres registration in the system to be able to create a game. The players only need to provide a nickname when they join using a code.
2. The director creates a game indicating the level of difficulty, and the number of bottles of wine to go through. There are 3 levels of difficulty: novice (3 wine characteristics), intermediate (5 wine characteristics), sommelier (10 wine characteristics). The characteristics will be grouped by visual, smell, and taste, and can vary from game to game, but must be the same for all wines. The bottles of wine will be identified by a number, and the director will provide the bottle name and year in order so the system can associate a number to each one. Once those details are in, the system will provide a unique game ID (a sequence of 5 letters and numbers) to the director, and a button to start the game. The director will also play the game, and the screen will look the same as the players, but will have the ability to move from wine to wine, and from group to group (visual, smell, taste) and stop the game (which will stop the game and show the ranking of players).
3. Once the game is initiated, the system will connect to openAI to request characteristics for the wines provided, and to build a matrix of characteristics and wines that players will need to guess.
3. Players can join with the unique game ID, and will be presented with the first wine they must guess and a welcome message. Once the director moves to the first group (visual) the players must assign the right characteristic to the right wine (they will need to choose wich characteristic matches with each wine). The director can move to the next group (smell) at any point in time, and that will move all the players to the next group. The next group after smell is taste, and after that the director can move all players to the next wine.
4. Once all the wines have been completed, the director can confirm the game is finished by pressing a button, which will reveal for each player how well they did, showing a ranking, and the ability to explore their answers versus the right answers, and also the ability to see other players answers.

The application must run on mobile phones.
The application must be multi-language - it must support Spanish, English, French and German (default based on user preferences).
The application requires configuration on the server side to store a OpenAI key.
If the wine characteristics are not very different between wines, a warning must be issued to the director.
Create a landing page for the game to explain the game, with a button for directors to register or login.
The game must be indexed by Google - make sure it has the right SEO characteristics.

Provide a description of the system and architecture so I can validate it before the implementation.

: <> : <> 3: <>

