import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import Modal from 'react-modal';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Carousel } from 'react-responsive-carousel';
import { FaCity, FaUser, FaStoreAlt, FaFileImage, FaWhatsapp } from "react-icons/fa";
import { MdReportProblem, MdOutlineReportProblem } from "react-icons/md";
import { CiNoWaitingSign } from "react-icons/ci";
import { LuImageOff } from "react-icons/lu";
import "react-responsive-carousel/lib/styles/carousel.min.css";

Modal.setAppElement('#root'); // Adiciona isso para resolver problemas de acessibilidade

const UserTickets = () => {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [finalizadoDescricao, setFinalizadoDescricao] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [slidesToShow, setSlidesToShow] = useState(1);
  const [showArrows, setShowArrows] = useState(false);
  const [checkboxes, setCheckboxes] = useState([]);
  const [newCheckbox, setNewCheckbox] = useState('');
  const [checkproblema, setCheckproblema] = useState([]);

  const handleCheckboxChange = (event) => {
    const { value, checked } = event.target;
    console.log(`Checkbox ${checked ? 'selecionado' : 'deselecionado'}:`, value);
    if (checked) {
      setCheckproblema([...checkproblema, value]);
    } else {
      setCheckproblema(checkproblema.filter(item => item !== value));
    }
  };

  const addNewCheckbox = async () => {
    if (newCheckbox) {
      try {
        console.log('Adicionando novo checkbox:', newCheckbox);
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

  const fetchCheckboxes = async () => {
    try {
      console.log('Buscando documento checkbox dentro de ordersControl...');
      const checkboxDocRef = doc(db, 'ordersControl', 'checkbox');
      const docSnapshot = await getDoc(checkboxDocRef);
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        console.log('Documento checkbox encontrado:', data);
        const checkboxesData = data.checkProblemas || [];
        console.log('Checkboxes encontrados:', checkboxesData);
        setCheckboxes(checkboxesData);
      } else {
        console.log('Documento checkbox não encontrado.');
      }
    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
    }
  };

  useEffect(() => {
    fetchCheckboxes();
  }, []);



  const formatWhatsappLink = (phone) => {
    const cleaned = ('' + phone).replace(/\D/g, '');
    const countryCode = '55';
    return `https://wa.me/${countryCode}${cleaned}`;
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'aberto':
        return 'bg-red-600';
      case 'andamento':
        return 'bg-orange-600';
      case 'finalizado':
        return 'bg-green-600';
      default:
        return 'bg-gray-700';
    }
  };

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const abertoRef = collection(db, 'chamados', 'aberto', 'tickets');
        const querySnapshot = await getDocs(abertoRef);
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
      } catch (error) {
        console.error('Erro ao buscar chamados:', error);
        setLoading(false);
      }
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

  const updateTicketStatus = async (id, status, descricaoFinalizacao = '') => {
    try {
      const ticketDocRef = doc(db, 'chamados', 'aberto', 'tickets', id);
      await updateDoc(ticketDocRef, { status, descricaoFinalizacao, checkproblema });
      setTickets(prevTickets =>
        prevTickets.map(ticket =>
          ticket.id === id ? { ...ticket, status, descricaoFinalizacao, checkproblema } : ticket
        )
      );
      setSelectedTicket(null);
      setFinalizadoDescricao('');
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

  if (loading) {
    return <div>Loading...</div>;
  }

  const uniqueUsers = [...new Set(tickets.map(ticket => ticket.user))];
  const uniqueStores = [...new Set(tickets.map(ticket => ticket.loja))];

  const openImageModal = (images) => {
    setSelectedImages(images);
    setModalIsOpen(true);
  };

  const closeImageModal = () => {
    setSelectedImages([]);
    setModalIsOpen(false);
  };

  const renderedTicketIds = new Set();

  return (
    <div className="p-4 w-full flex flex-col justify-center items-center">
      <div className='flex flex-col lg:flex-row gap-4 mb-4'>
        <h2 className="text-2xl font-bold">Chamados</h2>
        <div className=''>
          <select
            className="border p-2 mr-1 rounded"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os Status</option>
            <option value="aberto">Aberto</option>
            <option value="andamento">Andamento</option>
            <option value="finalizado">Finalizado</option>
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
            key={filteredTickets.map(ticket => ticket.id).join(',')} // Adiciona uma chave única para o Carousel
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
                return null; // Ocultar tickets duplicados
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
                    <div className='bg-white pt-0 px-2 pb-1 rounded-md mb-2'>
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
                      )}</div>
                    {ticket.descricaoFinalizacao ? (
                      <div className='bg-blue-100 pt-0 px-2 pb-1 rounded-md '>
                        <p className='text-center font-bold'>Conclusão</p>
                        <p className=' overflow-y-auto break-words max-h-14 min-h-14' >
                          {ticket.descricaoFinalizacao}
                        </p>
                      </div>

                    ) : (
                      <div className='bg-red-100 pt-0 px-2 pb-1 rounded-md '>
                        <p className='text-center font-bold'>Conclusão</p>
                        <p className=' overflow-y-auto break-words max-h-14 min-h-14' >
                          Aguardando
                        </p>
                      </div>
                    )
                    }
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => updateTicketStatus(ticket.id, 'aberto')}
                        className={`bg-red-400 text-white px-4 py-2 rounded ${ticket.status === 'finalizado' ? 'opacity-50 cursor-not-allowed' : ''} ${ticket.status === 'aberto' ? 'bg-red-600 ring-2 ring-white' : ''}`}
                        disabled={ticket.status === 'finalizado'}
                      >
                        Aberto
                      </button>
                      <button
                        onClick={() => updateTicketStatus(ticket.id, 'andamento')}
                        className={`bg-orange-400 text-white px-4 py-2 rounded ${ticket.status === 'finalizado' ? 'opacity-50 cursor-not-allowed' : ''} ${ticket.status === 'andamento' ? 'bg-orange-600 ring-2 ring-white' : ''}`}
                        disabled={ticket.status === 'finalizado'}
                      >
                        Andamento
                      </button>
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className={`bg-green-400 text-white px-4 py-2 rounded ${ticket.status === 'finalizado' ? 'opacity-50 cursor-not-allowed' : ''} ${ticket.status === 'finalizado' ? 'bg-green-600 ring-2 ring-white' : ''}`}
                        disabled={ticket.status === 'finalizado'}
                      >
                        Finalizado
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </Carousel>
        </div>
      )}

      {selectedTicket && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded min-w-[300px]">
            <h2 className="text-xl mb-2 font-bold text-center">Finalizar Chamado</h2>
            <textarea
              className="border p-2 w-full mb-2"
              rows="4"
              value={finalizadoDescricao}
              onChange={(e) => setFinalizadoDescricao(e.target.value)}
              placeholder="Adicione uma descrição de finalização..."
            ></textarea>
            <div className="mb-2">
              <h3 className='font-bold text-center'>Problemas encontrados</h3>
              {checkboxes.map((checkbox, index) => (
                <div className='grid items-center' key={index}>
                  <div>
                    <input
                      type="checkbox"
                      value={checkbox}
                      onChange={handleCheckboxChange}
                    />
                    <label className='ml-1'>{checkbox}</label>
                  </div>
                </div>
              ))}
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
                  console.log('Finalizando chamado:', checkproblema);
                  updateTicketStatus(selectedTicket.id, 'finalizado', finalizadoDescricao);
                  setSelectedTicket(null);
                }}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Salvar
              </button>
              <button
                onClick={() => setSelectedTicket(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalIsOpen}
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
    </div>
  );
};

export default UserTickets;
