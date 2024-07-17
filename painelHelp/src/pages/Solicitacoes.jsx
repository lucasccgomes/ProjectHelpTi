import React, { useState, useEffect } from 'react';
import { collection, getDoc, getDocs, doc, setDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import ListaSolicitacoes from '../components/ListaSolicitacoes';
import { MdOutlineRequestQuote } from "react-icons/md";
import Modal from 'react-modal';

const Solicitacao = () => {
  const { currentUser, currentUserRole } = useAuth();
  const [tipo, setTipo] = useState('reposição');
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
        setCidades(Object.keys(cidadesDoc.data()));
      }
    };

    fetchCidades();
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const numSolicite = await getNextSolicitacaoNumber();

      const novaSolicitacao = {
        tipo,
        nomeItem,
        motivo,
        whatsapp,
        user: currentUser,
        cargo: currentUserRole,
        cidade: selectedCidade,
        loja: selectedLoja,
        data: new Date(),
        status: "pendente",
        numSolicite
      };

      await setDoc(doc(db, 'solicitacoes', numSolicite), novaSolicitacao);
      setSuccess(true);
      console.log('Solicitação adicionada com sucesso');
    } catch (error) {
      setError('Erro ao adicionar solicitação');
      console.error('Erro ao adicionar solicitação:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex lg:justify-between lg:flex-row flex-col">

      <div className="pt-20 hidden lg:block">
        <div className='p-8 bg-white border lg:ml-28 m-4 lg:m-0 border-gray-300 rounded-xl shadow-lg'>
          <h2 className="text-xl font-bold mb-4">Nova Solicitação</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className='flex gap-4 flex-col'>
              <div>
                <label className="block mb-1 font-semibold">Tipo de Solicitação</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                  required
                >
                  <option value="reposição">Reposição</option>
                  <option value="novo">Novo</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 font-semibold">Nome do Item</label>
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
              <label className="block mb-1 font-semibold">Motivo</label>
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
              <div>
                <label className="block mb-1 font-semibold">Cidade</label>
                <select
                  value={selectedCidade}
                  onChange={(e) => setSelectedCidade(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                  required
                >
                  <option value="">Selecione uma Cidade</option>
                  {cidades.map(cidade => (
                    <option key={cidade} value={cidade}>
                      {cidade}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-semibold">Loja</label>
                <select
                  value={selectedLoja}
                  onChange={(e) => setSelectedLoja(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                  required
                >
                  <option value="">Selecione uma Loja</option>
                  {lojas.map((loja, index) => (
                    <option key={index} value={loja}>
                      {loja}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-white p-2 rounded hover:bg-primaryOpaci focus:outline-none focus:ring focus:ring-green-200"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar'}
            </button>
            {loading && <div className="mt-2 text-blue-500">Enviando solicitação...</div>}
          </form>
          {success && <div className="mt-4 text-green-500">Solicitação enviada com sucesso!</div>}
          {error && <div className="mt-4 text-red-500">{error}</div>}
        </div>
      </div>

      <div className="block lg:hidden p-4 pt-20">
        <button
          onClick={() => setModalIsOpen(true)}
          className="w-full bg-primary text-white p-2 flex justify-center items-center rounded hover:bg-primaryOpaci focus:outline-none focus:ring focus:ring-green-200"
        >
         <MdOutlineRequestQuote className='text-xl' /> Nova Solicitação
        </button>
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        className="modal"
        overlayClassName="overlay"
      >
        <div className='p-4 bg-white border border-gray-300 rounded-xl shadow-lg '>
          <h2 className="text-xl font-bold mb-4">Nova Solicitação</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className='flex gap-4 flex-col'>
              <div>
                <label className="block mb-1 font-semibold">Tipo de Solicitação</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                  required
                >
                  <option value="reposição">Reposição</option>
                  <option value="novo">Novo</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 font-semibold">Nome do Item</label>
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
              <label className="block mb-1 font-semibold">Motivo</label>
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
              <div>
                <label className="block mb-1 font-semibold">Cidade</label>
                <select
                  value={selectedCidade}
                  onChange={(e) => setSelectedCidade(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                  required
                >
                  <option value="">Selecione uma Cidade</option>
                  {cidades.map(cidade => (
                    <option key={cidade} value={cidade}>
                      {cidade}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-semibold">Loja</label>
                <select
                  value={selectedLoja}
                  onChange={(e) => setSelectedLoja(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:ring focus:ring-blue-200"
                  required
                >
                  <option value="">Selecione uma Loja</option>
                  {lojas.map((loja, index) => (
                    <option key={index} value={loja}>
                      {loja}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 focus:outline-none focus:ring focus:ring-green-200"
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Enviar'}
            </button>
            {loading && <div className="mt-2 text-blue-500">Enviando solicitação...</div>}
          </form>
          {success && <div className="mt-4 text-green-500">Solicitação enviada com sucesso!</div>}
          {error && <div className="mt-4 text-red-500">{error}</div>}
        </div>
      </Modal>

      <div className="">
        <ListaSolicitacoes />
      </div>
    </div>
  );
};

export default Solicitacao;
