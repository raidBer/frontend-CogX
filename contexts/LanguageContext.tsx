"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type Language = "en" | "fr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    "nav.player": "Player",
    "nav.lobbies": "Lobbies",
    "nav.leaderboard": "Leaderboard",
    "nav.admin": "Admin",

    // Player Page
    "player.title": "Player Setup",
    "player.enterName": "Enter your name",
    "player.namePlaceholder": "Your name",
    "player.join": "Join Game",
    "player.welcome": "Welcome back",

    // Lobbies Page
    "lobbies.title": "Game Lobbies",
    "lobbies.createNew": "Create New Lobby",
    "lobbies.gameType": "Game Type",
    "lobbies.maxPlayers": "Max Players",
    "lobbies.create": "Create Lobby",
    "lobbies.available": "Available Lobbies",
    "lobbies.noLobbies": "No lobbies available",
    "lobbies.createToStart": "Create a new lobby to start playing!",
    "lobbies.playingAs": "Playing as",
    "lobbies.lobbySingular": "lobby",
    "lobbies.lobbyPlural": "lobbies",
    "lobbies.availableCount": "available",
    "lobbies.players": "Players",
    "lobbies.host": "Host",
    "lobbies.status": "Status",
    "lobbies.joinLobby": "Join Lobby",
    "lobbies.selectGameType": "Select game type",
    "lobbies.fixedPlayers": "Fixed at 2 players for this game",
    "lobbies.password": "Password (optional)",
    "lobbies.passwordPlaceholder": "Leave empty for public lobby",
    "lobbies.private": "Private",
    "lobbies.full": "Full",
    "lobbies.enterPassword": "Enter lobby password:",
    "lobbies.pleaseCreatePlayer": "Please create or load a player first.",

    // Lobby Details
    "lobby.leave": "Leave Lobby",
    "lobby.copyLink": "Copy Link",
    "lobby.copied": "Copied!",
    "lobby.status": "Status",
    "lobby.youAreHost": "You are the host",
    "lobby.waiting": "Waiting for players...",
    "lobby.startGame": "Start Game",
    "lobby.waitingForHost": "Waiting for host to start the game...",
    "lobby.needPlayers": "Need at least 2 players to start",
    "lobby.howToPlay": "How to play",

    // Game - Tic Tac Toe
    "game.tictactoe.title": "Tic-Tac-Toe",
    "game.yourTurn": "Your Turn",
    "game.opponentTurn": "Opponent's Turn",
    "game.waitingToStart": "Waiting for game to start...",
    "game.initializeGame": "Initialize Game",
    "game.waitingForHostInit": "Waiting for host to start the game...",
    "game.youWon": "You Won!",
    "game.youLost": "You Lost!",
    "game.draw": "It's a Draw!",
    "game.winner": "Winner",
    "game.backToLobbies": "Back to Lobbies",
    "game.players": "Players",
    "game.notYourTurn": "Not your turn!",
    "game.cellOccupied": "Cell already occupied!",
    "game.you": "You",
    "game.playing": "Playing",
    "game.forfeit": "Forfeit",
    "game.confirmForfeit": "Are you sure you want to forfeit?",
    "game.loading": "Loading game...",
    "game.connect4": "Connect 4",
    "game.howToPlay": "How to Play",

    // Game Instructions
    "game.tictactoe.instructions":
      "Classic Tic-Tac-Toe game. Get 3 in a row to win!",
    "game.speedtyping.instructions":
      "Type the text as fast and accurately as possible. Fastest wins!",
    "game.puissance4.instructions":
      "Connect 4 pieces in a row (horizontal, vertical, or diagonal) to win!",
    "game.connect4Rule1": "Click on a column to drop your piece",
    "game.connect4Rule2": "Connect 4 pieces horizontally, vertically, or diagonally to win",
    "game.connect4Rule3": "Take turns with your opponent",

    // Leaderboard
    "leaderboard.title": "Leaderboard",
    "leaderboard.rank": "Rank",
    "leaderboard.player": "Player",
    "leaderboard.score": "Score",
    "leaderboard.date": "Date",
    "leaderboard.noScores": "No scores yet",

    // Admin
    "admin.title": "Admin Dashboard",
    "admin.createGame": "Create Game Type",
    "admin.gameName": "Game Name",
    "admin.maxPlayers": "Max Players",
    "admin.create": "Create",
    "admin.existingGames": "Existing Game Types",
    "admin.noGames": "No game types created yet",
    "admin.delete": "Delete",
    "admin.filters": "Filters",
    "admin.gameType": "Game Type",
    "admin.allGames": "All Games",
    "admin.limit": "Limit",
    "admin.applyFilters": "Apply Filters",
    "admin.gameSessions": "Game Sessions",
    "admin.loadingSessions": "Loading sessions...",
    "admin.players": "Players",
    "admin.actions": "Actions",
    "admin.status": "Status",
    "admin.finished": "Finished",
    "admin.inProgress": "In Progress",
    "admin.export": "Export",
    "admin.noSessions": "No sessions found",
    "admin.sessionDetails": "Session Details",
    "admin.started": "Started",
    "admin.duration": "Duration",
    "admin.actionStatistics": "Action Statistics",
    "admin.recentActions": "Recent Actions",
    "admin.selectSession": "Select a session to view details",
    "admin.confirmDelete": "Are you sure you want to delete this session?",
    "admin.deleteSuccess": "Session deleted successfully",
    "admin.errorFetchSessions": "Failed to fetch game sessions",
    "admin.errorFetchHistory": "Failed to fetch game history",
    "admin.errorDeleteSession": "Failed to delete session",
    "admin.errorExportSession": "Failed to export session",

    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.close": "Close",
    "common.save": "Save",
  },
  fr: {
    // Navigation
    "nav.player": "Joueur",
    "nav.lobbies": "Salons",
    "nav.leaderboard": "Classement",
    "nav.admin": "Admin",

    // Player Page
    "player.title": "Configuration du Joueur",
    "player.enterName": "Entrez votre nom",
    "player.namePlaceholder": "Votre nom",
    "player.join": "Rejoindre le Jeu",
    "player.welcome": "Bon retour",

    // Lobbies Page
    "lobbies.title": "Salons de Jeu",
    "lobbies.createNew": "Créer un Nouveau Salon",
    "lobbies.gameType": "Type de Jeu",
    "lobbies.maxPlayers": "Joueurs Max",
    "lobbies.create": "Créer un Salon",
    "lobbies.available": "Salons Disponibles",
    "lobbies.noLobbies": "Aucun salon disponible",
    "lobbies.createToStart": "Créez un nouveau salon pour commencer à jouer!",
    "lobbies.playingAs": "Joue en tant que",
    "lobbies.lobbySingular": "salon",
    "lobbies.lobbyPlural": "salons",
    "lobbies.availableCount": "disponibles",
    "lobbies.players": "Joueurs",
    "lobbies.host": "Hôte",
    "lobbies.status": "Statut",
    "lobbies.joinLobby": "Rejoindre",
    "lobbies.selectGameType": "Sélectionner le type de jeu",
    "lobbies.fixedPlayers": "Fixé à 2 joueurs pour ce jeu",
    "lobbies.password": "Mot de passe (optionnel)",
    "lobbies.passwordPlaceholder": "Laisser vide pour un salon public",
    "lobbies.private": "Privé",
    "lobbies.full": "Complet",
    "lobbies.enterPassword": "Entrez le mot de passe du salon:",
    "lobbies.pleaseCreatePlayer":
      "Veuillez d'abord créer ou charger un joueur.",

    // Lobby Details
    "lobby.leave": "Quitter le Salon",
    "lobby.copyLink": "Copier le Lien",
    "lobby.copied": "Copié!",
    "lobby.status": "Statut",
    "lobby.youAreHost": "Vous êtes l'hôte",
    "lobby.waiting": "En attente de joueurs...",
    "lobby.startGame": "Démarrer le Jeu",
    "lobby.waitingForHost": "En attente de l'hôte pour démarrer...",
    "lobby.needPlayers": "Besoin d'au moins 2 joueurs pour commencer",
    "lobby.howToPlay": "Comment jouer",

    // Game - Tic Tac Toe
    "game.tictactoe.title": "Morpion",
    "game.yourTurn": "Votre Tour",
    "game.opponentTurn": "Tour de l'Adversaire",
    "game.waitingToStart": "En attente du début du jeu...",
    "game.initializeGame": "Initialiser le Jeu",
    "game.waitingForHostInit": "En attente de l'hôte pour démarrer...",
    "game.youWon": "Vous avez Gagné!",
    "game.youLost": "Vous avez Perdu!",
    "game.draw": "Match Nul!",
    "game.winner": "Gagnant",
    "game.backToLobbies": "Retour aux Salons",
    "game.players": "Joueurs",
    "game.notYourTurn": "Ce n'est pas votre tour!",
    "game.cellOccupied": "Case déjà occupée!",
    "game.you": "Vous",
    "game.playing": "En train de jouer",
    "game.forfeit": "Abandonner",
    "game.confirmForfeit": "Êtes-vous sûr de vouloir abandonner?",
    "game.loading": "Chargement du jeu...",
    "game.connect4": "Puissance 4",
    "game.howToPlay": "Comment Jouer",

    // Game Instructions
    "game.tictactoe.instructions":
      "Jeu classique de Morpion. Alignez 3 symboles pour gagner!",
    "game.speedtyping.instructions":
      "Tapez le texte aussi vite et précisément que possible. Le plus rapide gagne!",
    "game.puissance4.instructions":
      "Alignez 4 pièces (horizontalement, verticalement ou en diagonale) pour gagner!",
    "game.connect4Rule1": "Cliquez sur une colonne pour y déposer votre pièce",
    "game.connect4Rule2": "Alignez 4 pièces horizontalement, verticalement ou en diagonale pour gagner",
    "game.connect4Rule3": "Jouez à tour de rôle avec votre adversaire",

    // Leaderboard
    "leaderboard.title": "Classement",
    "leaderboard.rank": "Rang",
    "leaderboard.player": "Joueur",
    "leaderboard.score": "Score",
    "leaderboard.date": "Date",
    "leaderboard.noScores": "Aucun score pour le moment",

    // Admin
    "admin.title": "Tableau de Bord Admin",
    "admin.createGame": "Créer un Type de Jeu",
    "admin.gameName": "Nom du Jeu",
    "admin.maxPlayers": "Joueurs Max",
    "admin.create": "Créer",
    "admin.existingGames": "Types de Jeux Existants",
    "admin.noGames": "Aucun type de jeu créé",
    "admin.delete": "Supprimer",
    "admin.filters": "Filtres",
    "admin.gameType": "Type de Jeu",
    "admin.allGames": "Tous les Jeux",
    "admin.limit": "Limite",
    "admin.applyFilters": "Appliquer les Filtres",
    "admin.gameSessions": "Sessions de Jeu",
    "admin.loadingSessions": "Chargement des sessions...",
    "admin.players": "Joueurs",
    "admin.actions": "Actions",
    "admin.status": "Statut",
    "admin.finished": "Terminé",
    "admin.inProgress": "En Cours",
    "admin.export": "Exporter",
    "admin.noSessions": "Aucune session trouvée",
    "admin.sessionDetails": "Détails de la Session",
    "admin.started": "Commencé",
    "admin.duration": "Durée",
    "admin.actionStatistics": "Statistiques d'Actions",
    "admin.recentActions": "Actions Récentes",
    "admin.selectSession": "Sélectionnez une session pour voir les détails",
    "admin.confirmDelete": "Êtes-vous sûr de vouloir supprimer cette session?",
    "admin.deleteSuccess": "Session supprimée avec succès",
    "admin.errorFetchSessions": "Échec de récupération des sessions de jeu",
    "admin.errorFetchHistory": "Échec de récupération de l'historique du jeu",
    "admin.errorDeleteSession": "Échec de suppression de la session",
    "admin.errorExportSession": "Échec d'exportation de la session",

    // Common
    "common.loading": "Chargement...",
    "common.error": "Erreur",
    "common.success": "Succès",
    "common.cancel": "Annuler",
    "common.confirm": "Confirmer",
    "common.close": "Fermer",
    "common.save": "Enregistrer",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    // Load language from localStorage
    const savedLanguage = localStorage.getItem("language") as Language;
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "fr")) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
