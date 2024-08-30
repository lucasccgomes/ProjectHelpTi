import React, { useState, useEffect } from 'react';
import { collection, getDoc, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Dropdown from '../Dropdown/Dropdown';
import { db } from '../../firebase';
import AlertModal from '../AlertModal/AlertModal';
import { useAuth } from '../../context/AuthContext';
import MyModal from '../MyModal/MyModal';
import { FaCity, FaStoreAlt } from "react-icons/fa";
import ImageUploadButton from '../ImageUploadButton/ImageUploadButton';

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
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

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
    try {
      const response = await fetch('https://bde5-2804-1784-30b3-6700-7285-c2ff-fe34-e4b0.ngrok-free.app/send-notification', {
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

      if (response.ok) {
        console.log('Notificação enviada com sucesso.');
        console.log('Resposta do servidor:', responseData);
      } else {
        console.error('Falha ao enviar notificação. Status:', response.status);
        console.error('Resposta do servidor:', responseData);
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (currentUser.cargo === 'Supervisor') {
      // Se o usuário for Supervisor, cidade e loja devem ser obrigatórios
      if (!selectedCity || selectedCity === 'Selecionar') {
        setAlertMessage('Por favor, selecione uma cidade.');
        setIsAlertModalOpen(true);
        setLoading(false);
        return;
      }

      if (!selectedStore || selectedStore === 'Selecionar') {
        setAlertMessage('Por favor, selecione uma loja.');
        setIsAlertModalOpen(true);
        setLoading(false);
        return;
      }
    }

    if (!localProblema) {
      setAlertMessage('Por favor, selecione o local do problema.');
      setIsAlertModalOpen(true);
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
          if (user.cargo === 'T.I' && Array.isArray(user.token)) { // Certifique-se de que `token` é um array
            tokens.push(...user.token); // Adicione todos os tokens do array
          }
        });
      });


      const notification = {
        title: nextOrder,
        body: description,
        click_action: "https://drogalira.com.br/gerenchamados",
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
      <MyModal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
        <h2 className="text-2xl text-gray-800 font-bold mb-1">Novo Chamado</h2>
        <form onSubmit={handleSubmit}>
          {currentUser.cargo === 'Supervisor' && (
            <div className='flex gap-2 text-center mb-2 bg-primaryBlueDark p-2 rounded-xl justify-center items-center'>
              <div className="min-w-36 flex justify-center items-center gap-2">
                <FaCity className="text-white text-2xl" />
                <Dropdown
                  label=""
                  options={['Selecionar', ...cities]}
                  selected={selectedCity}
                  onSelectedChange={setSelectedCity}
                />
              </div>
              <div className="min-w-36 flex justify-center items-center gap-2">
                <FaStoreAlt className="text-white text-2xl" />
                <Dropdown
                  label=""
                  options={['Selecionar', ...stores]}
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
          <div className="mb-3 flex flex-col-reverse justify-between">

            <div className="flex flex-col mt-2 border-2 rounded-xl p-2 justify-center">
              <label className="block text-gray-700 text-sm font-bold text-center">
                Local do Problema
              </label>
              <div className='gap-2 flex justify-between'>
                <button
                  type="button"
                  className={`bg-red-600 hover:bg-red-500 text-white font-bold py-1 w-full rounded focus:outline-none focus:shadow-outline ${localProblema === 'Caixa' ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setLocalProblema('Caixa')}
                >
                  Caixa
                </button>
                <button
                  type="button"
                  className={`bg-orange-600 hover:bg-orange-500 text-white font-bold py-1 w-full rounded focus:outline-none focus:shadow-outline ${localProblema === 'Balcão' ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setLocalProblema('Balcão')}
                >
                  Balcão
                </button>
                <button
                  type="button"
                  className={`bg-purple-600 hover:bg-purple-500 text-white font-bold py-1 w-full rounded focus:outline-none focus:shadow-outline ${localProblema === 'Gerencial' ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => setLocalProblema('Gerencial')}
                >
                  Gerencial
                </button>
              </div>
            </div>

            <div className="w-full">
              <label className="block text-gray-700 text-sm font-bold">
                Imagens
                <p className='text-gray-500 font-semibold'>
                  (Se possível, envie fotos do problema.)
                </p>
              </label>
              <ImageUploadButton handleImageChange={handleImageChange} />
              {images.length > 0 && (
                <div className="mt-2">
                  {Array.from(images).map((image, index) => (
                    <p key={index} className="text-sm text-gray-600">{image.name}</p>
                  ))}
                </div>
              )}
            </div>

          </div>

          <div className="flex items-center justify-between ">
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
      </MyModal>
      <AlertModal
        isOpen={isAlertModalOpen}
        onRequestClose={() => setIsAlertModalOpen(false)}
        title="Alerta"
        message={alertMessage}
      />

    </div>
  );

};

export default NewTicketModal;
