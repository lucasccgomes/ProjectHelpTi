import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import Modal from 'react-modal';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { FaCity, FaUser, FaStoreAlt } from "react-icons/fa";
import { MdReportProblem } from "react-icons/md";
import { useSwipeable } from 'react-swipeable';
import { GrCaretPrevious, GrCaretNext } from "react-icons/gr";

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
  const [selectedImage, setSelectedImage] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerSlide, setItemsPerSlide] = useState(3);

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
        setTickets(ticketsData);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar chamados:', error);
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  useEffect(() => {
    const updateItemsPerSlide = () => {
      if (window.innerWidth >= 1280) {
        setItemsPerSlide(3);
      } else if (window.innerWidth >= 1023) {
        setItemsPerSlide(3);
      } else {
        setItemsPerSlide(1);
      }
    };

    window.addEventListener('resize', updateItemsPerSlide);
    updateItemsPerSlide();

    return () => window.removeEventListener('resize', updateItemsPerSlide);
  }, []);

  const addTicket = (ticket) => {
    setTickets((prevTickets) => [ticket, ...prevTickets]);
  };

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? Math.ceil(tickets.length / itemsPerSlide) - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === Math.ceil(tickets.length / itemsPerSlide) - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const handlers = useSwipeable({
    onSwipedLeft: goToNext,
    onSwipedRight: goToPrevious,
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  const updateTicketStatus = async (id, status, descricaoFinalizacao = '') => {
    try {
      const ticketDocRef = doc(db, 'chamados', 'aberto', 'tickets', id);
      await updateDoc(ticketDocRef, { status, descricaoFinalizacao });
      setTickets(prevTickets =>
        prevTickets.map(ticket =>
          ticket.id === id ? { ...ticket, status, descricaoFinalizacao } : ticket
        )
      );
      setSelectedTicket(null);
      setFinalizadoDescricao('');
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

  const openImageModal = (image) => {
    setSelectedImage(image);
    setModalIsOpen(true);
  };

  const closeImageModal = () => {
    setSelectedImage('');
    setModalIsOpen(false);
  };

  return (
    <div className="p-4 w-screen flex flex-col justify-center items-center">
     <div className='flex flex-col lg:flex-row gap-4'>
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
        <div className="relative p-4 w-screen" {...handlers}>
          <div className="overflow-hidden">
            <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${currentIndex * 100 / itemsPerSlide}%)` }}>
              {filteredTickets.map(ticket => (
                <div key={ticket.id} className='gap-4' style={{ flex: `0 0 ${100 / itemsPerSlide}%` }}>
                  <div className="bg-gray-400 shadow-xl lg:min-w-[250px] mb-4 p-4 border-2 rounded">
                    <h3 className="text-xl uppercase text-center font-semibold">
                      {ticket.order}
                      <p className={`my-1 p-1 rounded-lg text-white uppercase ${getStatusClass(ticket.status)}`}>
                        {ticket.status}
                      </p>
                    </h3>

                    <div className='flex gap-4 mb-1'>
                      <p className='flex uppercase items-center'><FaCity />: {ticket.cidade}</p>
                      <p className='flex uppercase items-center'><FaUser />: {ticket.user}</p>
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

                    <div className='bg-white p-3 rounded-md max-h-20 overflow-y-auto mb-2 mt-2'>
                      <p className='text-center font-bold'>Descrição</p>
                      <p>{ticket.descricao}</p>
                    </div>

                    <div className='bg-white p-3 rounded-md max-h-20 overflow-y-auto mb-2 mt-2'>
                      <p className='text-center font-bold'>Tentativa</p>
                      <p>{ticket.tentou}</p>
                    </div>

                    {Array.isArray(ticket.imgUrl) && ticket.imgUrl.length > 0 && (
                      <div className='bg-white p-3 rounded-md mb-2 mt-2'>
                        <p className='text-center font-bold'>Imagens</p>
                        <div className='flex gap-2'>
                          {ticket.imgUrl.map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`ticket-${index}`}
                              className='w-16 h-16 object-cover cursor-pointer'
                              onClick={() => openImageModal(image)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {ticket.descricaoFinalizacao && (
                      <p className='bg-blue-100 p-3 rounded-md mt-2 max-h-40 overflow-y-auto'>
                        <strong>Conclusão:</strong>
                        {ticket.descricaoFinalizacao}
                      </p>
                    )}
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
              ))}
            </div>
          </div>
          <button onClick={goToPrevious} className="absolute top-1/2 left-5 transform -translate-y-1/2 bg-primary text-white p-3 rounded opacity-85"><GrCaretPrevious /></button>
          <button onClick={goToNext} className="absolute top-1/2 right-5 transform -translate-y-1/2 bg-primary text-white p-3 rounded opacity-85"><GrCaretNext /></button>
        </div>
      )}

      {selectedTicket && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded min-w-[300px]">
            <h2 className="text-xl mb-2">Finalizar Chamado</h2>
            <textarea
              className="border p-2 w-full mb-2"
              rows="4"
              value={finalizadoDescricao}
              onChange={(e) => setFinalizadoDescricao(e.target.value)}
              placeholder="Adicione uma descrição de finalização..."
            ></textarea>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
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
        contentLabel="Imagem Grande"
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
      >
        <div className="bg-white p-4 rounded">
          <img src={selectedImage} alt="imagem grande" className="max-w-[500px] max-h-[450px]" />
          <button onClick={closeImageModal} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">
            Fechar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default UserTickets;
