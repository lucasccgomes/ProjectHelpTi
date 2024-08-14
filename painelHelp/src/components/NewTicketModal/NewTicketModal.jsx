import React, { useState, useEffect } from 'react';
import { collection, getDoc, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Dropdown from '../Dropdown/Dropdown';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';

const NewTicketModal = ({ isOpen, onClose, addTicket }) => {
  const { currentUser } = useAuth();
  const [description, setDescription] = useState('');
  const [attempt, setAttempt] = useState('');
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState({ cidade: '', loja: '', whatsapp: '' });
  const [localProblema, setLocalProblema] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [images, setImages] = useState([]);
  const [cities, setCities] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedCity, setSelectedCity] = useState('Todas');
  const [selectedStore, setSelectedStore] = useState('Todas');

  const storage = getStorage();

  useEffect(() => {
    const fetchCitiesAndStores = async () => {
      const citiesDoc = await getDoc(doc(db, 'ordersControl', 'cidades'));
      if (citiesDoc.exists()) {
        const citiesData = citiesDoc.data();
        const cityNames = Object.keys(citiesData);

        setCities(cityNames);

        if (selectedCity && selectedCity !== 'Todas') {
          setStores(citiesData[selectedCity] || []);
        } else {
          const allStores = cityNames.flatMap(city => citiesData[city] || []);
          setStores(allStores);
        }
      }
    };

    fetchCitiesAndStores();
  }, [selectedCity]);


  useEffect(() => {
    const fetchUserDetails = async () => {
      if (currentUser && currentUser.user) {
        try {
          const usersRef = collection(db, 'usuarios');
          const citiesSnapshot = await getDocs(usersRef);

          let found = false;
          for (const cityDoc of citiesSnapshot.docs) {
            const cityData = cityDoc.data();
            if (cityData[currentUser.user]) {
              found = true;
              const userDoc = cityData[currentUser.user];
              setUserDetails({ cidade: cityDoc.id, loja: userDoc.loja, whatsapp: userDoc.whatsapp });
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

  const sendNotification = async (tokens, notification) => {
    console.log('Tokens para envio de notificação:', tokens);
    console.log('Dados da notificação:', notification);
    try {
      const response = await fetch('https://8bef-2804-1784-30b3-6700-a555-89b1-9fd5-7d87.ngrok-free.app/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tokens,
          notification: {
            title: notification.title,
            body: notification.body,
            click_action: notification.click_action,
            icon: notification.icon
          }
        })
      });
      const responseData = await response.json();
      console.log('Resposta do servidor:', responseData);
      console.log('Notificação enviada com sucesso.');
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  };


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
        cidade: currentUser.cargo === 'Supervisor' ? selectedCity : userDetails.cidade,
        data: new Date(),
        descricao: description,
        imgUrl: imageUrls,
        loja: currentUser.cargo === 'Supervisor' ? selectedStore : userDetails.loja,
        order: nextOrder,
        status: 'Aberto',
        tentou: attempt,
        user: currentUser.user,
        localProblema: localProblema,
        whatsapp: userDetails.whatsapp
      };

      const newTicketRef = doc(db, 'chamados', 'aberto', 'tickets', nextOrder);
      await setDoc(newTicketRef, newTicket);

      addTicket({ id: nextOrder, ...newTicket });

      // Coletar tokens dos usuários com cargo "T.I"
      const usersRef = collection(db, 'usuarios');
      const citiesSnapshot = await getDocs(usersRef);

      const tokens = [];
      citiesSnapshot.forEach((cityDoc) => {
        const cityData = cityDoc.data();
        Object.keys(cityData).forEach((userKey) => {
          const user = cityData[userKey];
          if (user.cargo === 'T.I' && user.token) {
            tokens.push(user.token);
          }
        });
      });

      console.log('Tokens coletados:', tokens);

      const notification = {
        title: nextOrder,
        body: description,
        click_action: "https://admhelpti.netlify.app/",
        icon: "https://iili.io/duTTt8Q.png"
      };

      await sendNotification(tokens, notification);

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
    <div className="fixed inset-0 z-40 pt-1 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white m-4  px-5 border-gray-400 border-2 rounded-xl shadow-lg ">
        <h2 className="text-2xl font-bold mb-1">Novo Chamado</h2>
        <form onSubmit={handleSubmit}>
          {currentUser.cargo === 'Supervisor' && (
            <div className='flex gap-2 text-center mb-2 bg-primaryBlueDark p-2 rounded-xl justify-center items-center'>
              <div className="min-w-36">
                <label className="block text-white text-sm font-bold mb-2">
                  Cidade
                </label>
                <Dropdown
                  label=""
                  options={['Todas', ...cities]}
                  selected={selectedCity}
                  onSelectedChange={setSelectedCity}
                />
              </div>
              <div className="min-w-28">
                <label className="block text-white text-sm font-bold mb-2">
                  Loja
                </label>
                <Dropdown
                  label=""
                  options={['Todas', ...stores]}
                  selected={selectedStore}
                  onSelectedChange={setSelectedStore}
                />
              </div>
            </div>
          )}
          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-bold" htmlFor="description">
              Descrição
              <p className='text-gray-500 font-semibold'>
                (descreva detalhadamente o problema.)
              </p>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>
          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-bold" htmlFor="attempt">
              Tentativa
              <p className='text-gray-500 font-semibold'>
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
          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-bold mb-1 text-center">
              Local do Problema
            </label>
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
          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-bold">
              Imagens
              <p className='text-gray-500 font-semibold'>
                (Se possível, envie fotos do problema.)
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
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-primaryBlueDark hover:bg-primaryOpaci text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
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
