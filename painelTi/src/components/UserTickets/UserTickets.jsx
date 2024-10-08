import React, { useEffect, useState, useRef } from 'react';
import { collection, getDocs, doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import Modal from 'react-modal';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Carousel } from 'react-responsive-carousel';
import { FaCity, FaUser, FaStoreAlt, FaFileImage, FaWhatsapp } from "react-icons/fa";
import { MdReportProblem, MdOutlineReportProblem } from "react-icons/md";
import { CiNoWaitingSign } from "react-icons/ci";
import { LuImageOff } from "react-icons/lu";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import NotificationHandler from '../NotificationHandler/NotificationHandler';
import Dropdown from '../Dropdown/Dropdown';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import MyModal from '../Modal/MyModal';

Modal.setAppElement('#root');

const UserTickets = () => {
  const [selectedProblem, setSelectedProblem] = useState('');
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [finalizadoDescricao, setFinalizadoDescricao] = useState('');
  const [imageModalIsOpen, setImageModalIsOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [slidesToShow, setSlidesToShow] = useState(1);
  const [showArrows, setShowArrows] = useState(false);
  const [checkboxes, setCheckboxes] = useState([]);
  const [newCheckbox, setNewCheckbox] = useState('');
  const [checkproblema, setCheckproblema] = useState([]);
  const [notificationTicket, setNotificationTicket] = useState(null);
  const sentNotifications = useRef(new Set());
  const [conclusaoModalIsOpen, setConclusaoModalIsOpen] = useState(false);
  const [tratativaViewModalIsOpen, setTratativaViewModalIsOpen] = useState(false);
  const [tratativaEditModalIsOpen, setTratativaEditModalIsOpen] = useState(false);
  const [finalizarModalIsOpen, setFinalizarModalIsOpen] = useState(false);

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline'],  // Ferramentas de texto
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],  // Listas ordenadas e não ordenadas
      ['clean']  // Botão para limpar formatação
    ],
  };

  const [tratativaModalIsOpen, setTratativaModalIsOpen] = useState(false);
  const [treatment, setTreatment] = useState('');

  const addNewCheckbox = async () => {
    if (newCheckbox) {
      try {
        const checkboxDocRef = doc(db, 'ordersControl', 'checkbox');
        const docSnapshot = await getDoc(checkboxDocRef);

        let updatedCheckboxes = [];
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          updatedCheckboxes = data.checkProblemas ? [...data.checkProblemas, newCheckbox] : [newCheckbox];
        } else {
          updatedCheckboxes = [newCheckbox];
        }

        await updateDoc(checkboxDocRef, { checkProblemas: updatedCheckboxes });

        setCheckboxes(updatedCheckboxes);
        setNewCheckbox('');
      } catch (error) {
        console.error('Erro ao adicionar novo checkbox:', error);
      }
    }
  };

  useEffect(() => {
    const fetchCheckboxes = async () => {
      try {
        const checkboxDocRef = doc(db, 'ordersControl', 'checkbox');
        const docSnapshot = await getDoc(checkboxDocRef);
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const checkboxesData = data.checkProblemas || [];
          setCheckboxes(checkboxesData);
        } else {
          console.log('Documento checkbox não encontrado.');
        }
      } catch (error) {
        console.error('Erro ao buscar documentos:', error);
      }
    };

    fetchCheckboxes();
  }, []);

  const formatWhatsappLink = (phone) => {
    const cleaned = ('' + phone).replace(/\D/g, '');
    const countryCode = '55';
    return `https://wa.me/${countryCode}${cleaned}`;
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Aberto':
        return 'bg-red-600';
      case 'Andamento':
        return 'bg-orange-600';
      case 'Finalizado':
        return 'bg-green-600';
      case 'VSM':
        return 'bg-blue-700';
      default:
        return 'bg-gray-700';
    }
  };

  useEffect(() => {
    const fetchTickets = async () => {
      const abertoRef = collection(db, 'chamados', 'aberto', 'tickets');

      const unsubscribe = onSnapshot(abertoRef, (querySnapshot) => {
        const ticketsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            data: data.data.toDate()
          };
        });

        const uniqueTickets = Array.from(new Map(ticketsData.map(ticket => [ticket.id, ticket])).values());
        setTickets(uniqueTickets);
        setLoading(false);
      }, (error) => {
        console.error('Erro ao buscar chamados:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    };

    fetchTickets();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSlidesToShow(3);
      } else {
        setSlidesToShow(1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateTicketStatus = async (id, status, descricaoFinalizacao = '', treatment = '') => {
    try {
      const ticketDocRef = doc(db, 'chamados', 'aberto', 'tickets', id);
      await updateDoc(ticketDocRef, { status, descricaoFinalizacao, treatment, checkproblema: [selectedProblem] });

      const updatedTicket = tickets.find(ticket => ticket.id === id);
      setTickets(prevTickets =>
        prevTickets.map(ticket =>
          ticket.id === id ? { ...ticket, status, descricaoFinalizacao, treatment, checkproblema } : ticket
        )
      );

      if (status === 'Andamento' || status === 'Finalizado') {
        const userDocRef = doc(db, 'usuarios', updatedTicket.cidade);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data()[updatedTicket.user];
          if (userData && userData.token) {
            const notificationMessage = {
              title: updatedTicket.order,
              body: `Status alterado para ${status}`,
              click_action: "https://drogalira.com.br/usertickets",
              icon: "https://iili.io/duTTt8Q.png"
            };

            const response = await fetch('https://bde5-2804-1784-30b3-6700-7285-c2ff-fe34-e4b0.ngrok-free.app/send-notification', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ tokens: [userData.token], notification: notificationMessage })
            });
            const result = await response.json();
            console.log('Resposta do servidor:', result);
            console.log('Notificação enviada com sucesso.');
          } else {
            console.error('Token do usuário não encontrado.');
          }
        } else {
          console.error('Documento do usuário não encontrado.');
        }
      }

      setSelectedTicket(null);
      setFinalizadoDescricao('');
      setTreatment('');
      setCheckproblema([]);
    } catch (error) {
      console.error('Erro ao atualizar status do chamado:', error);
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    (statusFilter ? ticket.status === statusFilter : true) &&
    (userFilter ? ticket.user === userFilter : true) &&
    (storeFilter ? ticket.loja === storeFilter : true)
  );

  // Aqui definimos `uniqueUsers` e `uniqueStores` com base nos tickets carregados
  const uniqueUsers = [...new Set(tickets.map(ticket => ticket.user))];
  const uniqueStores = [...new Set(tickets.map(ticket => ticket.loja))];

  if (loading) {
    return <div>Loading...</div>;
  }

  const openImageModal = (images) => {
    setSelectedImages(images);
    setImageModalIsOpen(true);
  };

  const closeImageModal = () => {
    setSelectedImages([]);
    setImageModalIsOpen(false);
  };

  const renderedTicketIds = new Set();

  const openTratativaViewModal = (ticket) => {
    setSelectedTicket(ticket);
    setTratativaViewModalIsOpen(true);
  };

  const closeTratativaViewModal = () => {
    setTratativaViewModalIsOpen(false);
  };

  const openTratativaEditModal = (ticket) => {
    setSelectedTicket(ticket);
    setTreatment(ticket.treatment || '');
    setTratativaEditModalIsOpen(true);
  };

  const closeTratativaEditModal = () => {
    setTratativaEditModalIsOpen(false);
  };

  const openFinalizarModal = (ticket) => {
    setSelectedTicket(ticket);
    setFinalizarModalIsOpen(true);
  };

  const closeFinalizarModal = () => {
    setFinalizarModalIsOpen(false);
  };

  const openConclusaoModal = (ticket) => {
    setSelectedTicket(ticket);
    setConclusaoModalIsOpen(true);
  };

  const closeConclusaoModal = () => {
    setConclusaoModalIsOpen(false);
  };

  return (
    <div className="p-4 w-full flex flex-col justify-center items-center">
      {notificationTicket && !sentNotifications.current.has(notificationTicket.id) && (
        <NotificationHandler
          user={{ user: notificationTicket.user, cidade: notificationTicket.cidade }}
          message={{ title: notificationTicket.order, body: `Status alterado para ${newStatus}` }}
          onSent={() => {
            console.log(`Notificação enviada para o ticket ${notificationTicket.id}`);
            sentNotifications.current.add(notificationTicket.id);
          }}
        />
      )}
      <div className='flex flex-col lg:flex-row gap-4 mb-4'>
        <h2 className="text-2xl font-bold">Chamados</h2>
        <div className=''>
          <select
            className="border p-2 mr-1 rounded"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os Status</option>
            <option value="Aberto">Aberto</option>
            <option value="Andamento">Andamento</option>
            <option value="Finalizado">Finalizado</option>
            <option value="VSM">VSM</option>
          </select>
          <select
            className="border p-2 mr-2 rounded"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          >
            <option value="">Todos os Usuários</option>
            {uniqueUsers.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
          <select
            className="border p-2 rounded"
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
          >
            <option value="">Todas as Lojas</option>
            {uniqueStores.map(store => (
              <option key={store} value={store}>{store}</option>
            ))}
          </select>
        </div>
      </div>
      {filteredTickets.length === 0 ? (
        <p>Nenhum chamado encontrado.</p>
      ) : (
        <div
          className="relative w-full"
          onMouseEnter={() => setShowArrows(true)}
          onMouseLeave={() => setShowArrows(false)}
        >
          <Carousel
            key={filteredTickets.map(ticket => ticket.id).join(',')}
            showArrows={showArrows}
            showStatus={false}
            showIndicators={false}
            showThumbs={false}
            useKeyboardArrows
            swipeable
            centerMode={true}
            centerSlidePercentage={slidesToShow === 1 ? 100 : 33.33}
          >
            {filteredTickets.map(ticket => {
              if (renderedTicketIds.has(ticket.id)) {
                return null;
              }
              renderedTicketIds.add(ticket.id);
              return (
                <div key={ticket.id} className='gap-4'>
                  <div className="bg-gray-400 shadow lg:min-w-[250px] mb-4 p-4 border-2 rounded">
                    <h3 className="text-xl uppercase text-center font-semibold">
                      {ticket.order}
                      <p className={`my-1 p-1 rounded-lg text-white uppercase ${getStatusClass(ticket.status)}`}>
                        {ticket.status}
                      </p>
                    </h3>
                    <div className='flex justify-between gap-4 mb-1 mt-2'>
                      <p className='flex uppercase items-center'><FaCity />: {ticket.cidade}</p>
                      <p className='flex uppercase items-center'><FaUser />: {ticket.user}</p>
                      <p className='bg-green-600 p-2 rounded-2xl shadow-lg'>
                        <a target='_blank' href={formatWhatsappLink(ticket.whatsapp)}>
                          <FaWhatsapp className='text-2xl text-white' />
                        </a>
                      </p>
                    </div>
                    <div className='flex gap-4 mb-1'>
                      <p className='flex uppercase items-center'><FaStoreAlt />: {ticket.loja}</p>
                      <p className='flex uppercase items-center'>
                        <MdReportProblem />: {ticket.localProblema}
                      </p>
                    </div>
                    <div className='flex gap-4 mb-1'>
                      <p>
                        <strong>
                          Data:
                        </strong>
                        {ticket.data.toLocaleString()}
                      </p>
                    </div>
                    <div className='bg-white pt-0 px-2 pb-1 roundFed-md mb-2'>
                      <p className='text-center font-bold'>Descrição</p>
                      <p className=' overflow-y-auto break-words max-h-14 min-h-14' >{ticket.descricao}</p>
                    </div>
                    <div className='bg-white pt-0 px-2 pb-1 rounded-md '>
                      <p className='text-center font-bold'>Tentativa</p>
                      <p className=' overflow-y-auto break-words max-h-14 min-h-14' >{ticket.tentou}</p>
                    </div>
                    {Array.isArray(ticket.imgUrl) && ticket.imgUrl.length > 0 ? (
                      <div className='flex items-center justify-center p-3 rounded-md mb-2 mt-2'>
                        <p className='text-center font-bold'></p>
                        <button
                          className='bg-blue-500 flex justify-center items-center text-white px-4 py-2 rounded'
                          onClick={() => openImageModal(ticket.imgUrl)}
                        >
                          <FaFileImage /> &nbsp; Ver Imagens
                        </button>
                      </div>
                    ) : (
                      <div className='flex items-center justify-center p-3 rounded-md mb-2 mt-2'>
                        <p className='text-center font-bold'></p>
                        <button
                          className='bg-gray-600 pointer-events-none flex justify-center items-center text-white px-4 py-2 rounded'
                        >
                          <LuImageOff /> &nbsp; Sem Imagens
                        </button>
                      </div>
                    )}
                    <div className='bg-orange-100 mb-1 rounded-md'>
                      {ticket.checkproblema && ticket.checkproblema.length > 0 ? (
                        <ul>
                          {ticket.checkproblema.map((checkbox, index) => (
                            <li key={index} className='flex justify-center items-center font-bold'><MdOutlineReportProblem />{checkbox}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className='flex justify-center items-center'><CiNoWaitingSign />Aguardando</p>
                      )}
                    </div>
                    {ticket.treatment ? (
                      <div className='bg-blue-100 px-2 py-1 rounded-md '>
                        <button
                          onClick={() => openTratativaViewModal(ticket)}
                          className='bg-orange-600 text-white px-4 py-2 rounded w-full'
                        >
                          Ver Tratativa
                        </button>
                      </div>
                    ) : (
                      <>
                        {ticket.descricaoFinalizacao ? (
                          <div className='bg-blue-100 px-2 py-1 rounded-md '>
                            <button
                              onClick={() => openConclusaoModal(ticket)}
                              className='bg-green-600 text-white px-4 py-2 rounded w-full'
                            >
                              Ver Conclusão
                            </button>
                          </div>
                        ) : (
                          <div className='bg-red-100 pt-1 px-2 pb-1 rounded-md '>
                            <p className='text-center font-bold'></p>
                            <button
                             
                              className='bg-gray-400 text-white px-4 py-2 cursor-not-allowed rounded w-full'
                            >
                           Conclusão aguardando
                            </button>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex flex-col gap-2 mt-2">
                      <div className=''>
                        <button
                          onClick={() => updateTicketStatus(ticket.id, 'Aberto')}
                          className={`bg-red-400 text-white px-4 py-2 rounded mr-2 ${ticket.status === 'Finalizado' ? 'opacity-50 cursor-not-allowed' : ''} ${ticket.status === 'Aberto' ? 'bg-red-600 ring-2 ring-white' : ''}`}
                          disabled={ticket.status === 'Finalizado'}
                        >
                          Aberto
                        </button>
                        <button
                          onClick={() => openTratativaEditModal(ticket)}
                          className={`bg-orange-400 text-white px-4 py-2 rounded ${ticket.status === 'Finalizado' ? 'opacity-50 cursor-not-allowed' : ''} ${ticket.status === 'Andamento' ? 'bg-orange-600 ring-2 ring-white' : ''}`}
                          disabled={ticket.status === 'Finalizado'}
                        >
                          Andamento
                        </button>
                        <button
                          onClick={() => openFinalizarModal(ticket)}
                          className={`bg-green-400 text-white px-4 py-2 rounded ml-2 ${ticket.status === 'Finalizado' ? 'opacity-50 cursor-not-allowed' : ''} ${ticket.status === 'Finalizado' ? 'bg-green-600 ring-2 ring-white' : ''}`}
                          disabled={ticket.status === 'Finalizado'}
                        >
                          Finalizado
                        </button>
                      </div>
                      <div>
                        <button
                          onClick={() => updateTicketStatus(ticket.id, 'VSM')}
                          className={`bg-blue-400 text-white px-4 w-full  py-2 rounded ${ticket.status === 'Finalizado' ? 'opacity-50 cursor-not-allowed' : ''} ${ticket.status === 'VSM' ? 'bg-blue-700 ring-2 ring-white' : ''}`}
                          disabled={ticket.status === 'Finalizado'}
                        >
                          (VSM)-Externo
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </Carousel>
        </div>
      )}

      {selectedTicket && finalizarModalIsOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded min-w-[350px]">
            <h2 className="text-xl mb-2 font-bold text-center">Finalizar Chamado</h2>
            <ReactQuill
              value={finalizadoDescricao}
              onChange={setFinalizadoDescricao}
              modules={modules}
              placeholder="Adicione uma descrição de finalização..."
              className="mb-12 h-28"
            />
            <div className="mb-2">
              <h3 className='font-bold text-center'>Problemas encontrados</h3>
              <Dropdown
                options={checkboxes}
                label="Selecione um problema"
                selected={selectedProblem}
                onSelectedChange={(problem) => setSelectedProblem(problem)}
              />
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={newCheckbox}
                  onChange={(e) => setNewCheckbox(e.target.value)}
                  className="border p-2"
                  placeholder="Adicionar novo problema"
                />
                <button onClick={addNewCheckbox} className="bg-blue-500 text-white px-4 py-2 rounded">
                  +
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  updateTicketStatus(selectedTicket.id, 'Finalizado', finalizadoDescricao);
                  closeFinalizarModal();
                }}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Salvar
              </button>
              <button
                onClick={closeFinalizarModal}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {tratativaEditModalIsOpen && (
        <Modal
          isOpen={tratativaEditModalIsOpen}
          onRequestClose={closeTratativaEditModal}
          contentLabel="Tratativa"
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
        >
          <div className="bg-white p-4 rounded min-w-[300px]">
            <h2 className="text-xl mb-2 font-bold text-center">Tratativa</h2>
            <ReactQuill
              value={treatment}
              onChange={setTreatment}
              modules={modules}
              placeholder="Descreva a tratativa..."
              className="mb-12 h-28"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  updateTicketStatus(selectedTicket.id, 'Andamento', '', treatment);
                  closeTratativaEditModal();
                }}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Salvar
              </button>
              <button
                onClick={closeTratativaEditModal}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      <Modal
        isOpen={imageModalIsOpen}
        onRequestClose={closeImageModal}
        contentLabel="Imagens"
        className="fixed inset-0 flex !z-[1000] items-center justify-center bg-black bg-opacity-50"
      >
        <div className="bg-white p-4 rounded z-40">
          <Carousel
            showArrows={true}
            showStatus={false}
            showIndicators={false}
            showThumbs={false}
            infiniteLoop={true}
            useKeyboardArrows
            centerMode
            swipeable
          >
            {selectedImages.map((image, index) => (
              <div key={index}>
                <img src={image} alt={`Imagem ${index}`} className="max-w-[500px] max-h-[450px]" />
              </div>
            ))}
          </Carousel>
          <button onClick={closeImageModal} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">
            Fechar
          </button>
        </div>
      </Modal>

      <MyModal isOpen={conclusaoModalIsOpen} onClose={closeConclusaoModal}>
        <h2 className="text-xl font-bold mb-4">Conclusão</h2>
        {selectedTicket && (
          <div
            className="overflow-y-auto break-words"
            dangerouslySetInnerHTML={{ __html: selectedTicket.descricaoFinalizacao }}
          ></div>
        )}
      </MyModal>

      <MyModal isOpen={tratativaViewModalIsOpen} onClose={closeTratativaViewModal}>
        <h2 className="text-xl font-bold mb-4">Tratativa</h2>
        {selectedTicket && (
          <div
            className="overflow-y-auto break-words"
            dangerouslySetInnerHTML={{ __html: selectedTicket.treatment }}
          ></div>
        )}
      </MyModal>
    </div>
  );
};

export default UserTickets;
