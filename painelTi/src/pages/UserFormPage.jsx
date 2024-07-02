import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import Modal from "react-modal";

Modal.setAppElement('#root');

const UserForm = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [cidade, setCidade] = useState("");
  const [loja, setLoja] = useState("");
  const [pass, setPass] = useState("");
  const [user, setUser] = useState("");
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, "usuarios"));
      const userList = [];
      querySnapshot.forEach((doc) => {
        userList.push({ id: doc.id, ...doc.data() });
      });
      setUsers(userList);
    };

    fetchUsers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedUser && user && cidade && loja && pass) {
      const userDoc = doc(db, "usuarios", selectedUser);
      const userMap = {
        cidade,
        loja,
        pass,
        user,
      };
      await setDoc(userDoc, { [user]: userMap }, { merge: true });
      setModalMessage("Usuário gravado com sucesso!");
      setModalIsOpen(true);
      setSelectedUser("");
      setCidade("");
      setLoja("");
      setPass("");
      setUser("");
    } else {
      setModalMessage("Por favor, preencha todos os campos.");
      setModalIsOpen(true);
    }
  };

  return (
    <div className="pt-20 container mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Local do DB</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
          >
            <option value="">Selecione o BD</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Nome do usuário</label>
          <input
            type="text"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Cidade</label>
          <input
            type="text"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Loja</label>
          <input
            type="text"
            value={loja}
            onChange={(e) => setLoja(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
          />
        </div>
        <div>
          <label className="block mb-1">Senha</label>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded"
        >
          Gravar Usuário
        </button>
      </form>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        className="fixed inset-0 flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      >
        <div className="bg-white p-4 rounded shadow-md">
          <h2 className="text-xl mb-4">{modalMessage}</h2>
          <button
            onClick={() => setModalIsOpen(false)}
            className="bg-blue-500 text-white p-2 rounded"
          >
            Fechar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default UserForm;
