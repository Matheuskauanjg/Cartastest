import { updateDoc, doc } from "firebase/firestore";

// Função para remover uma carta do jogador e atualizar o estado no Firestore
export const removePlayedCard = async (gameRoom, user, selectedCard, gameState) => {
  const gameRef = doc(gameState.db, "games", gameRoom);

  // Encontra o jogador correspondente
  const playerIndex = gameState.players.findIndex((player) => player.name === user.displayName);
  if (playerIndex === -1) return;

  // Remove a carta jogada do deck do jogador
  const player = gameState.players[playerIndex];
  const newWhiteCards = player.whiteCards.filter((card) => card !== selectedCard);

  // Atualiza o deck do jogador e adiciona a carta jogada no banco de dados
  const updatedPlayers = [...gameState.players];
  updatedPlayers[playerIndex] = { ...player, whiteCards: newWhiteCards };

  await updateDoc(gameRef, {
    players: updatedPlayers,
    playedCards: [...gameState.playedCards, { card: selectedCard, user: user.displayName }],
  });
};
