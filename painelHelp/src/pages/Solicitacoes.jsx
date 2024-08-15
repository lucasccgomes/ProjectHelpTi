import React, { useState, useEffect } from 'react';
import { collection, getDoc, getDocs, doc, setDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import ListaSolicitacoes from '../components/ListaSolicitacoes';
import { MdOutlineRequestQuote } from "react-icons/md";
import Modal from 'react-modal';
import { useTransition, animated } from '@react-spring/web';
import AlertModal from '../components/AlertModal/AlertModal';
import { IoClose } from "react-icons/io5";
import Dropdown from '../components/Dropdown/Dropdown';
import NotificationModal from '../components/NotificationModal/NotificationModal';

const Solicitacao = () => {
  const { currentUser, currentUserRole } = useAuth();
  const [tipo, setTipo] = useState('Reposição');
  const [nomeItem, setNomeItem] = useState('');
  const [motivo, setMotivo] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cidades, setCidades] = useState([]);
  const [selectedCidade, setSelectedCidade] = useState('');
  const [lojas, setLojas] = useState([]);
  const [selectedLoja, setSelectedLoja] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertModalContent, setAlertModalContent] = useState({ title: '', message: '', showOkButton: true });
  const [statusFilter, setStatusFilter] = useState('Todos');

  useEffect(() => {
    const fetchUserDetails = async () => {
      const usuariosRef = collection(db, 'usuarios');
      const querySnapshot = await getDocs(usuariosRef);
      querySnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData && userData[currentUser]) {
          setWhatsapp(userData[currentUser].whatsapp || '');
        }
      });
    };

    fetchUserDetails();
  }, [currentUser]);

  useEffect(() => {
    const fetchCidades = async () => {
      const cidadesRef = doc(db, 'ordersControl', 'cidades');
      const cidadesDoc = await getDoc(cidadesRef);
      if (cidadesDoc.exists()) {
        const cidadesData = cidadesDoc.data();
        if (currentUserRole === 'Supervisor') {
          setCidades(Object.keys(cidadesData));
        } else {
          const userCity = currentUser.cidade;
          if (userCity && cidadesData[userCity]) {
            setCidades([userCity]);
            setSelectedCidade(userCity);
          } else {
            setCidades([]);
          }
        }
      }
    };

    fetchCidades();
  }, [currentUser, currentUserRole]);

  useEffect(() => {
    const fetchLojas = async () => {
      const lojasRef = doc(db, 'ordersControl', 'cidades');
      const lojasDoc = await getDoc(lojasRef);
      if (lojasDoc.exists()) {
        const lojasData = lojasDoc.data();
        if (currentUserRole === 'Supervisor') {
          let allLojas = [];
          Object.keys(lojasData).forEach(city => {
            allLojas = [...allLojas, ...lojasData[city]];
          });
          setLojas(allLojas);
        } else if (selectedCidade && lojasData[selectedCidade]) {
          setLojas(lojasData[selectedCidade]);
        } else {
          setLojas([]);
        }
      }
    };

    if (currentUserRole === 'Supervisor' || selectedCidade) {
      fetchLojas();
    }
  }, [selectedCidade, currentUserRole]);


  useEffect(() => {
    if (selectedCidade) {
      const fetchLojas = async () => {
        const lojasRef = doc(db, 'ordersControl', 'cidades');
        const lojasDoc = await getDoc(lojasRef);
        if (lojasDoc.exists()) {
          setLojas(lojasDoc.data()[selectedCidade] || []);
        }
      };

      fetchLojas();
    } else {
      setLojas([]);
    }
  }, [selectedCidade]);

  const getNextSolicitacaoNumber = async () => {
    const soliciteControlRef = doc(db, 'ordersControl', 'solicite');
    try {
      const result = await runTransaction(db, async (transaction) => {
        const soliciteDoc = await transaction.get(soliciteControlRef);
        if (!soliciteDoc.exists()) {
          throw "Documento de controle de solicitações não encontrado!";
        }

        const soliciteControl = soliciteDoc.data().soliciteControl;
        const lastSolicitacao = soliciteControl[soliciteControl.length - 1];
        const lastNumber = parseInt(lastSolicitacao.replace('SolicitaçãoA', ''), 10);
        const newNumber = lastNumber + 1;
        const newSolicitacao = `SolicitaçãoA${String(newNumber).padStart(3, '0')}`;

        soliciteControl.push(newSolicitacao);
        transaction.update(soliciteControlRef, { soliciteControl });

        return newSolicitacao;
      });
      return result;
    } catch (error) {
      console.error("Erro ao gerar o próximo número de solicitação: ", error);
      throw error;
    }
  };

  const fetchTITokens = async () => {
    const usuariosRef = collection(db, 'usuarios');
    const querySnapshot = await getDocs(usuariosRef);
    const tokens = [];

    querySnapshot.forEach(doc => {
      const userData = doc.data();
      Object.keys(userData).forEach(userKey => {
        const user = userData[userKey];
        if (user.cargo === 'T.I' && user.token) {
          tokens.push(user.token);
        }
      });
    });

    return tokens;
  };

  const sendNotification = async (tokens, notification) => {
    try {
      const response = await fetch('https://6f46-2804-1784-30b3-6700-6c8d-e16-5377-9e5c.ngrok-free.app/send-notification', {
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

      if (!response.ok) {
        throw new Error('Erro ao enviar notificações');
      }
    } catch (error) {
      console.error('Erro ao enviar notificações:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    setAlertModalContent({ title: 'Enviando', message: 'Enviando solicitação...', showOkButton: false });
    setAlertModalOpen(true);

    if (!selectedLoja) {
      setError('Por favor, selecione uma loja.');
      setAlertModalContent({ title: 'Erro', message: 'Por favor, selecione uma loja.', showOkButton: true });
      setLoading(false);
      return;
    }

    try {
      const numSolicite = await getNextSolicitacaoNumber();

      const novaSolicitacao = {
        tipo,
        nomeItem,
        motivo,
        whatsapp: currentUser.whatsapp,
        user: currentUser.user,
        cargo: currentUserRole,
        cidade: selectedCidade,
        loja: selectedLoja,
        data: new Date(),
        status: "Pendente",
        numSolicite
      };

      await setDoc(doc(db, 'solicitacoes', numSolicite), novaSolicitacao);
      setSuccess(true);
      setAlertModalContent({ title: 'Sucesso', message: 'Solicitação enviada com sucesso!', showOkButton: true });

      // Buscar tokens e enviar notificações
      const tokens = await fetchTITokens();
      const notification = {
        title: 'Nova Solicitação',
        body: `Uma nova solicitação: ${nomeItem}`,
        click_action: "https://admhelpti.netlify.app/",
        icon: "https://iili.io/duTTt8Q.png"
      };

      await sendNotification(tokens, notification);

      // Limpar os campos após envio bem-sucedido
      setTipo('Reposição');
      setNomeItem('');
      setMotivo('');
      setWhatsapp('');
      setSelectedCidade('');
      setSelectedLoja('');
    } catch (error) {
      setError('Erro ao adicionar solicitação');
      setAlertModalContent({ title: 'Erro', message: 'Erro ao adicionar solicitação', showOkButton: true });
      console.error('Erro ao adicionar solicitação:', error);
    } finally {
      setLoading(false);
    }
  };

  const transitions = useTransition(modalIsOpen, {
    from: { opacity: 0, transform: 'translateY(-50%)' },
    enter: { opacity: 1, transform: 'translateY(0%)' },
    leave: { opacity: 0, transform: 'translateY(-50%)' },
  });

  return (
    <div className="flex lg:justify-between lg:flex-row flex-col">
      <div className="pt-20 hidden lg:block">
        <div className='p-5 bg-altBlue border min-w-[400px] lg:ml-[13rem] m-4 lg:m-0 border-gray-300 rounded-xl shadow-lg'>
          <h2 className="text-xl font-bold mb-4 block  text-gray-700">Nova Solicitação</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className='flex gap-4 flex-col'>
              <div className="">
                <Dropdown
                  label="Tipo de Solicitação"
                  options={['Reposição', 'Novo']}
                  selected={tipo}
                  onSelectedChange={(option) => setTipo(option)}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Nome do Item</label>
                <input
                  type="text"
                  value={nomeItem}
                  onChange={(e) => setNomeItem(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Motivo</label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded max-h-14 focus:ring focus:ring-blue-200"
                rows="4"
                required
              ></textarea>
            </div>
            {whatsapp && (
              <div className='hidden'>
                <label className="block mb-1 font-semibold">WhatsApp</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                  required
                />
              </div>
            )}
            <div className='flex gap-4'>
              <div className='w-52'>
                <Dropdown
                  label="Cidade"
                  options={cidades}
                  selected={selectedCidade || "Cidade"}
                  onSelectedChange={(option) => setSelectedCidade(option)}
                />
              </div>
              <div className='w-24'>
                <Dropdown
                  label="Loja"
                  options={lojas}
                  selected={selectedLoja || "Loja"}
                  onSelectedChange={(option) => setSelectedLoja(option)}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-primaryBlueDark text-white p-2 rounded hover:bg-primaryOpaci focus:outline-none focus:ring focus:ring-gray-200"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar'}
            </button>
          </form>
        </div>
      </div>
      <div className="block lg:hidden p-4 pt-20">
        <button
          onClick={() => setModalIsOpen(true)}
          className="w-full bg-primaryBlueDark text-white p-2 flex justify-center items-center rounded hover:bg-primaryOpaci focus:outline-none focus:ring focus:ring-gray-200"
        >
          <MdOutlineRequestQuote className='text-xl' /> Nova Solicitação
        </button>
      </div>
      {transitions(
        (styles, item) => item && (
          <Modal
            isOpen={modalIsOpen}
            onRequestClose={() => setModalIsOpen(false)}
            className="modal"
            overlayClassName="overlay"
            style={{
              overlay: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
              content: { transition: 'opacity 0.3s ease-in-out' }
            }}
          >
            <animated.div style={styles}>
              <div className='p-4 bg-white border border-gray-300 rounded-xl shadow-lg '>
                <div className='flex justify-between mb-1'>
                  <h2 className="text-xl font-bold mb-4">Nova Solicitação</h2>
                  <button
                    onClick={() => setModalIsOpen(false)}
                    className='bg-red-600 text-white p-2 rounded-full h-7 w-7 flex justify-center items-center shadow-xl'
                  >
                    <IoClose className='' />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className='flex gap-4 flex-col'>
                    <div>
                      <div className='w-full'>
                        <Dropdown
                          label="Tipo de Solicitação"
                          options={['Reposição', 'Novo']}
                          selected={tipo}
                          onSelectedChange={(option) => setTipo(option)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">Nome do Item</label>
                      <input
                        type="text"
                        value={nomeItem}
                        onChange={(e) => setNomeItem(e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">Motivo</label>
                    <textarea
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      className="w-full border border-gray-300 p-2 rounded max-h-14 focus:ring focus:ring-blue-200"
                      rows="4"
                      required
                    >
                    </textarea>
                  </div>
                  {whatsapp && (
                    <div className='hidden'>
                      <label className="block mb-1 font-semibold">WhatsApp</label>
                      <input
                        type="text"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                        required
                      />
                    </div>
                  )}
                  <div className='flex gap-4'>
                    <div className='w-52'>
                      <Dropdown
                        label="Cidade"
                        options={cidades}
                        selected={selectedCidade || "Cidade"}
                        onSelectedChange={(option) => setSelectedCidade(option)}
                      />
                    </div>
                    <div>
                      <Dropdown
                        label="Loja"
                        options={lojas}
                        selected={selectedLoja || "Loja"}
                        onSelectedChange={(option) => setSelectedLoja(option)}
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-primaryBlueDark text-white p-2 rounded hover:bg-primaryOpaci focus:outline-none focus:ring focus:ring-gray-200"
                    disabled={loading}
                  >
                    {loading ? 'Enviando...' : 'Enviar'}
                  </button>
                </form>
              </div>
            </animated.div>
          </Modal>
        )
      )}

      <AlertModal
        isOpen={alertModalOpen}
        onRequestClose={() => setAlertModalOpen(false)}
        title={alertModalContent.title}
        message={alertModalContent.message}
        showOkButton={alertModalContent.showOkButton}
      />

      <div className="">
        <ListaSolicitacoes statusFilter={statusFilter} />
      </div>
      <NotificationModal />
    </div>
  );
};

export default Solicitacao;
