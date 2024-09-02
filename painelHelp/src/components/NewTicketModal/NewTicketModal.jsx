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

// Componente principal que gerencia a criação de novos chamados
const NewTicketModal = ({ isOpen, onClose, addTicket }) => {
  const { currentUser } = useAuth(); // Obtenção do usuário atual autenticado
  const [description, setDescription] = useState(''); // Estado para a descrição do problema
  const [attempt, setAttempt] = useState(''); // Estado para as tentativas de resolução
  const [loading, setLoading] = useState(false); // Estado para indicar se a submissão está em andamento
  const [userDetails, setUserDetails] = useState({ cidade: '', loja: '', whatsapp: '' }); // Estado para os detalhes do usuário
  const [localProblema, setLocalProblema] = useState(''); // Estado para o local do problema
  const [modalMessage, setModalMessage] = useState(''); // Estado para mensagens de modal
  const [images, setImages] = useState([]); // Estado para armazenar imagens selecionadas
  const [cities, setCities] = useState([]); // Estado para armazenar as cidades disponíveis
  const [stores, setStores] = useState([]); // Estado para armazenar as lojas disponíveis
  const [selectedCity, setSelectedCity] = useState(''); // Estado para armazenar a cidade selecionada
  const [selectedStore, setSelectedStore] = useState(''); // Estado para armazenar a loja selecionada
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false); // Estado para controlar a visibilidade do modal de alerta
  const [alertMessage, setAlertMessage] = useState(''); // Estado para a mensagem de alerta

  const storage = getStorage(); // Inicialização do serviço de storage do Firebase

  // useEffect para buscar e atualizar as cidades e lojas disponíveis quando a cidade selecionada mudar
  useEffect(() => {
    const fetchCitiesAndStores = async () => {
      const citiesDoc = await getDoc(doc(db, 'ordersControl', 'cidades')); // Obtém as cidades do Firestore
      if (citiesDoc.exists()) {
        const citiesData = citiesDoc.data(); // Extrai os dados das cidades
        const cityNames = Object.keys(citiesData); // Obtém os nomes das cidades

        setCities(cityNames); // Atualiza o estado com os nomes das cidades

        if (selectedCity && selectedCity !== 'Todas') {
          setStores(citiesData[selectedCity] || []); // Atualiza as lojas com base na cidade selecionada
        } else {
          const allStores = cityNames.flatMap(city => citiesData[city] || []); // Junta todas as lojas de todas as cidades
          setStores(allStores); // Atualiza o estado com todas as lojas
        }
      }
    };

    fetchCitiesAndStores(); // Chama a função de fetch
  }, [selectedCity]); // Executa novamente quando a cidade selecionada mudar

  // useEffect para buscar os detalhes do usuário ao carregar o componente ou quando o usuário atual mudar
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (currentUser && currentUser.user) {
        try {
          const usersRef = collection(db, 'usuarios'); // Referência à coleção de usuários no Firestore
          const citiesSnapshot = await getDocs(usersRef); // Obtém todos os documentos de usuários

          let found = false;
          for (const cityDoc of citiesSnapshot.docs) {
            const cityData = cityDoc.data();
            if (cityData[currentUser.user]) { // Verifica se o usuário atual está registrado em alguma cidade
              found = true;
              const userDoc = cityData[currentUser.user];
              setUserDetails({ cidade: cityDoc.id, loja: userDoc.loja, whatsapp: userDoc.whatsapp }); // Atualiza os detalhes do usuário
              break;
            }
          }

          if (!found) {
            console.log('Usuário não encontrado em nenhuma cidade.');
          }

        } catch (error) {
          console.error('Erro ao buscar detalhes do usuário:', error); // Loga o erro, se ocorrer
        }
      }
    };
    fetchUserDetails(); // Chama a função de fetch
  }, [currentUser]); // Executa novamente quando o usuário atual mudar

  // Função para enviar notificações aos usuários relevantes
  const sendNotification = async (tokens, notification) => {
    try {
      const response = await fetch('https://8f38-2804-1784-30b3-6700-7285-c2ff-fe34-e4b0.ngrok-free.app/send-notification', {
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

      const responseData = await response.json(); // Converte a resposta em JSON

      if (response.ok) {
        console.log('Notificação enviada com sucesso.');
      } else {
        console.error('Falha ao enviar notificação. Status:', response.status);
        console.error('Resposta do servidor:', responseData);
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error); // Loga o erro, se ocorrer
    }
  };

  // Função que é chamada ao submeter o formulário
  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita o comportamento padrão do formulário
    setLoading(true); // Indica que a submissão está em andamento

    // Verifica se o usuário tem um cargo específico e, se sim, exige que uma cidade e loja sejam selecionadas
    if (currentUser.cargo === 'Supervisor' || currentUser.cargo === 'T.I' || currentUser.cargo === 'Claudemir') {
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

    if (!localProblema) { // Verifica se o local do problema foi selecionado
      setAlertMessage('Por favor, selecione o local do problema.');
      setIsAlertModalOpen(true);
      setLoading(false);
      return;
    }

    try {
      const orderControlRef = doc(db, 'ordersControl', 'orders'); // Referência ao documento de controle de pedidos
      const orderControlSnap = await getDoc(orderControlRef); // Obtém o documento de controle de pedidos

      let nextOrder = 'A001';
      if (orderControlSnap.exists()) {
        const lastOrderArray = orderControlSnap.data().ordersNumber; // Obtém o último número de pedido
        const lastOrder = lastOrderArray[0];

        // Verifica se o lastOrder segue o padrão esperado
        if (/^TC[A-Z]\d{3}$/.test(lastOrder)) {
          const lastOrderNumber = parseInt(lastOrder.substring(3), 10); // Extrai o número do pedido
          const nextOrderNumber = lastOrderNumber + 1;
          const nextOrderLetter = lastOrder.charAt(2);

          nextOrder = 'TC' + nextOrderLetter + nextOrderNumber.toString().padStart(3, '0'); // Gera o próximo número de pedido

          if (nextOrderNumber > 999) { // Verifica se precisa incrementar a letra
            const newLetter = String.fromCharCode(nextOrderLetter.charCodeAt(0) + 1);
            nextOrder = 'TC' + newLetter + '001';
          }
        } else {
          // Caso o formato não corresponda, inicia o novo padrão
          nextOrder = 'TCA001';
        }

        await updateDoc(orderControlRef, {
          ordersNumber: [nextOrder] // Atualiza o número do pedido no Firestore
        });
      } else {
        await setDoc(orderControlRef, {
          ordersNumber: [nextOrder] // Cria o número do pedido se ainda não existir
        });
      }

      // Upload de imagens
      const imageUrls = [];
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const storageRef = ref(storage, `chamados/${nextOrder}/${image.name}`); // Referência de storage para a imagem
        const snapshot = await uploadBytes(storageRef, image); // Faz o upload da imagem
        const url = await getDownloadURL(snapshot.ref); // Obtém a URL da imagem
        imageUrls.push(url); // Adiciona a URL ao array de URLs
      }

      // Cria um novo objeto de chamado
      const newTicket = {
        cidade: (currentUser.cargo === 'Supervisor' || currentUser.cargo === 'T.I' || currentUser.cargo === 'Claudemir') ? selectedCity : userDetails.cidade,
        data: new Date(), // Define a data atual
        descricao: description, // Define a descrição do problema
        imgUrl: imageUrls, // Define as URLs das imagens
        loja: (currentUser.cargo === 'Supervisor' || currentUser.cargo === 'T.I' || currentUser.cargo === 'Claudemir') ? selectedStore : userDetails.loja,
        order: nextOrder, // Define o número do pedido
        status: 'Aberto', // Define o status do chamado
        tentou: attempt, // Define as tentativas de resolução
        user: currentUser.user, // Define o usuário que criou o chamado
        localProblema: localProblema, // Define o local do problema
        whatsapp: userDetails.whatsapp // Define o WhatsApp do usuário
      };

      const newTicketRef = doc(db, 'chamados', 'aberto', 'tickets', nextOrder); // Referência ao novo chamado no Firestore
      await setDoc(newTicketRef, newTicket); // Salva o novo chamado no Firestore

      addTicket({ id: nextOrder, ...newTicket }); // Adiciona o novo chamado à lista de chamados

      // Coleta os tokens dos usuários com cargo "T.I"
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

      // Cria a notificação
      const notification = {
        title: nextOrder,
        body: description,
        click_action: "https://drogalira.com.br/gerenchamados",
        icon: "https://iili.io/duTTt8Q.png"
      };

      await sendNotification(tokens, notification); // Envia a notificação

      // Reseta os estados após o envio do chamado
      setDescription('');
      setAttempt('');
      setLocalProblema('');
      setImages([]);
      setLoading(false);
      onClose(); // Fecha o modal
    } catch (error) {
      console.error('Erro ao adicionar chamado:', error); // Loga o erro, se ocorrer
      setLoading(false);
    }
  };

  // Função para gerenciar a seleção de imagens
  const handleImageChange = (e) => {
    if (e.target.files.length + images.length > 4) {
      alert('Você pode enviar no máximo 4 imagens.');
      return;
    }
    setImages([...images, ...e.target.files]); // Adiciona as novas imagens ao estado
  };

  if (!isOpen) return null; // Se o modal não estiver aberto, retorna null

  return (
    <div className="fixed inset-0 z-40 pt-1 bg-black bg-opacity-50 flex items-center justify-center">
      <MyModal isOpen={isOpen} onClose={onClose} showCloseButton={false}>
        <h2 className="text-2xl text-gray-800 font-bold mb-1">Novo Chamado</h2>
        <form onSubmit={handleSubmit}>
          {(currentUser.cargo === 'Supervisor' || currentUser.cargo === 'T.I' || currentUser.cargo === 'Claudemir') && (
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
