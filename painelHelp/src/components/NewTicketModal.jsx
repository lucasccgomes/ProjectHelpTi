import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDoc, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
  const [images, setImages] = useState([]);
  const storage = getStorage();
  

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

      // Upload de imagens
      const imageUrls = [];
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const storageRef = ref(storage, `chamados/${nextOrder}/${image.name}`);
        const snapshot = await uploadBytes(storageRef, image);
        const url = await getDownloadURL(snapshot.ref);
        imageUrls.push(url);
      }

      const newTicket = {
        cidade: userDetails.cidade,
        data: new Date(),
        descricao: description,
        imgUrl: imageUrls,
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
      setImages([]);
      setLoading(false);
      onClose();
    } catch (error) {
      console.error('Erro ao adicionar chamado:', error);
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files.length + images.length > 4) {
      alert('Você pode enviar no máximo 4 imagens.');
      return;
    }
    setImages([...images, ...e.target.files]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 pt-11 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white m-4 p-4 rounded shadow-lg w-96">
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
              Tentativa
              <p className='text-gray-500'>
              (Descreva as ações que você tomou para tentar resolver o problema)
              </p>
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
            <label className="block text-gray-700 text-sm font-bold mb-2 text-center">Local do Problema</label>
            <div className="flex gap-4 justify-center">
              <button
                type="button"
                className={`bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${localProblema === 'Caixa' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setLocalProblema('Caixa')}
              >
                Caixa
              </button>
              <button
                type="button"
                className={`bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${localProblema === 'Balcão' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setLocalProblema('Balcão')}
              >
                Balcão
              </button>
              <button
                type="button"
                className={`bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${localProblema === 'Gerencial' ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setLocalProblema('Gerencial')}
              >
                Gerencial
              </button>
            </div>
            {modalMessage && <p className="text-red-500 text-xs italic">{modalMessage}</p>}
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Imagens
              <p className='text-gray-500'>
              (Se possível, envie fotos que possam ajudar a solucionar o problema.)
                </p>
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
            {images.length > 0 && (
              <div className="mt-2">
                {Array.from(images).map((image, index) => (
                  <p key={index} className="text-sm text-gray-600">{image.name}</p>
                ))}
              </div>
            )}
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
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
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
