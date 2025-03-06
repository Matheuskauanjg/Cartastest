import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, logout } from "../firebase"; // Certifique-se de que o db esteja importado
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, getDocs, query, orderBy, doc, getDoc, updateDoc } from "firebase/firestore";  // Adicione estas importações

function Lobby() {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);  // Para armazenar as salas
  const [loading, setLoading] = useState(true);  // Para gerenciar o estado de carregamento
  const navigate = useNavigate();

  // Função para criar uma nova sala
  const createRoom = async () => {
    if (!user) return;

    try {
      const newRoomRef = await addDoc(collection(db, "rooms"), {
        creator: user.displayName,
        players: [user.displayName],  // O criador da sala entra automaticamente
        status: "waiting",  // Status da sala: waiting (aguardando jogadores)
      });
      console.log("Sala criada:", newRoomRef.id);
      navigate(`/game/${newRoomRef.id}`);  // Redireciona para a sala criada
    } catch (error) {
      console.error("Erro ao criar sala:", error);
    }
  };

  // Função para buscar as salas disponíveis
  const fetchRooms = async () => {
    try {
      const roomsQuery = query(collection(db, "rooms"), orderBy("status"));
      const querySnapshot = await getDocs(roomsQuery);
      const availableRooms = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRooms(availableRooms);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao buscar salas:", error);
    }
  };

  // Função para entrar em uma sala
  const joinRoom = async (roomId) => {
    if (!user) return;

    try {
      const roomRef = doc(db, "rooms", roomId);
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) {
        console.log("Sala não encontrada");
        return;
      }
      
      const roomData = roomSnap.data();
      const updatedPlayers = [...roomData.players, user.displayName];
      
      // Verifica se a sala está cheia
      if (updatedPlayers.length >= 4) {
        alert("Sala cheia! Não é possível entrar.");
        return;
      }

      await updateDoc(roomRef, {
        players: updatedPlayers,
      });

      console.log("Jogador entrou na sala:", roomId);
      navigate(`/game/${roomId}`);  // Redireciona para a sala
    } catch (error) {
      console.error("Erro ao entrar na sala:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/login");
      } else {
        setUser(user);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchRooms();  // Buscar as salas disponíveis quando o usuário estiver autenticado
    }
  }, [user]);

  return (
    <div>
      <h1>Lobby</h1>
      {user ? <p>Jogador: {user.displayName}</p> : <p>Carregando...</p>}
      <button onClick={createRoom}>Criar Sala</button>
      <button onClick={logout}>Sair</button>

      <h2>Salas Disponíveis</h2>
      {loading ? (
        <p>Carregando salas...</p>
      ) : rooms.length === 0 ? (
        <p>Não há salas disponíveis no momento.</p>
      ) : (
        <div>
          {rooms.map((room) => (
            <div key={room.id}>
              <h3>Sala: {room.id}</h3>
              <p>Criador: {room.creator}</p>
              <p>Jogadores: {room.players.join(", ")}</p>
              <button onClick={() => joinRoom(room.id)}>Entrar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Lobby;
