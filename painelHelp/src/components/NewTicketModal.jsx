import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDoc, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';

const NewTicketModal = ({ isOpen, onClose, addTicket }) => {
  const { currentUser } = useAuth();
  const [description, setDescription] = useState('');
  const [attempt, setAttempt] = useState('');
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState({ cidade: '', loja: '' });
  const [localProblema, setLocalProblema] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (currentUser) {
        try {
          const usersRef = collection(db, 'usuarios');
          const citiesSnapshot = await getDocs(usersRef);

          let found = false;
          for (const cityDoc of citiesSnapshot.docs) {
            const cityData = cityDoc.data();
            if (cityData[currentUser]) {
              found = true;
              const userDoc = cityData[currentUser];
              setUserDetails({ cidade: cityDoc.id, loja: userDoc.loja });
              break;
            }
          }

          if (!found) {
            console.log('Usuário não encontrado em nenhuma cidade.');
          }

        } catch (error) {
          console.error('Erro ao buscar detalhes do usuário:', error);
        }
      }
    };
    fetchUserDetails();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!localProblema) {
      setModalMessage('Por favor, selecione o local do problema.');
      setLoading(false);
      return;
    }

    try {
      const orderControlRef = doc(db, 'ordersControl', 'orders');
      const orderControlSnap = await getDoc(orderControlRef);

      let nextOrder = 'A001';
      if (orderControlSnap.exists()) {
        const lastOrderArray = orderControlSnap.data().ordersNumber;
        const lastOrder = lastOrderArray[0];
        const nextOrderNumber = parseInt(lastOrder.substring(8)) + 1;
        const nextOrderLetter = lastOrder.charAt(7);
        nextOrder = 'Chamado' + nextOrderLetter + nextOrderNumber.toString().padStart(3, '0');
        if (nextOrderNumber > 999) {
          const newLetter = String.fromCharCode(nextOrderLetter.charCodeAt(0) + 1);
          nextOrder = 'Chamado' + newLetter + '001';
        }

        await updateDoc(orderControlRef, {
          ordersNumber: [nextOrder]
        });
      } else {
        await setDoc(orderControlRef, {
          ordersNumber: [nextOrder]
        });
      }

      const newTicket = {
        cidade: userDetails.cidade,
        data: new Date(),
        descricao: description,
        imgUrl: '',
        loja: userDetails.loja,
        order: nextOrder,
        status: 'aberto',
        tentou: attempt,
        user: currentUser,
        localProblema: localProblema
      };

      const newTicketRef = doc(db, 'chamados', 'aberto', 'tickets', nextOrder);
      await setDoc(newTicketRef, newTicket);

      addTicket({ id: nextOrder, ...newTicket });
      setDescription('');
      setAttempt('');
      setLocalProblema('');
      setLoading(false);
      onClose();
    } catch (error) {
      console.error('Erro ao adicionar chamado:', error);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4">Novo Chamado</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
              Descrição <p className='text-gray-500'>(descreva detalhadamente o problema.)</p>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="attempt">
              Tentativa <p className='text-gray-500'>(oque você tentou fazer?)</p>
            </label>
            <textarea
              id="attempt"
              value={attempt}
              onChange={(e) => setAttempt(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">Local do Problema</label>
            <div className="flex justify-between">
              <button
                type="button"
                className={`bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${localProblema === 'Caixa' ? 'opacity-100' : 'opacity-50'}`}
                onClick={() => setLocalProblema('Caixa')}
              >
                Caixa
              </button>
              <button
                type="button"
                className={`bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${localProblema === 'Balcão' ? 'opacity-100' : 'opacity-50'}`}
                onClick={() => setLocalProblema('Balcão')}
              >
                Balcão
              </button>
              <button
                type="button"
                className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${localProblema === 'Gerencial' ? 'opacity-100' : 'opacity-50'}`}
                onClick={() => setLocalProblema('Gerencial')}
              >
                Gerencial
              </button>
            </div>
            {modalMessage && <p className="text-red-500 text-xs italic">{modalMessage}</p>}
          </div>
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTicketModal;
