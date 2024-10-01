import React, { useState, useEffect } from 'react';
import { collection, getDoc, getDocs, doc, setDoc, runTransaction, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import ListaSolicitTi from '../components/ListaSolicitTi/ListaSolicitTi';
import { MdOutlineRequestQuote } from "react-icons/md";
import Modal from 'react-modal';
import { useTransition, animated } from '@react-spring/web';
import AlertModal from '../components/AlertModal/AlertModal';
import Dropdown from '../components/Dropdown/Dropdown';
import NotificationModal from '../components/NotificationModal/NotificationModal';
import { IoIosSend } from "react-icons/io";
import AdmListaSolicitTi from '../components/ListaSolicitTi/AdmListaSolicitTi';
import MyModal from '../components/MyModal/MyModal';

Modal.setAppElement('#root'); // Ajuste o seletor conforme necessário


const SoliciteTi = () => {
  const { currentUser, currentUserRole } = useAuth(); // Obtém o usuário atual e o cargo do contexto de autenticação
  const [tipo, setTipo] = useState('Reposição'); // Estado para armazenar o tipo de solicitação
  const [nomeItem, setNomeItem] = useState(''); // Estado para armazenar o nome do item
  const [motivo, setMotivo] = useState(''); // Estado para armazenar o motivo da solicitação
  const [whatsapp, setWhatsapp] = useState(''); // Estado para armazenar o número de WhatsApp do usuário
  const [cidades, setCidades] = useState([]); // Estado para armazenar a lista de cidades
  const [selectedCidade, setSelectedCidade] = useState(''); // Estado para armazenar a cidade selecionada
  const [lojas, setLojas] = useState([]); // Estado para armazenar a lista de lojas
  const [selectedLoja, setSelectedLoja] = useState(''); // Estado para armazenar a loja selecionada
  const [loading, setLoading] = useState(false); // Estado para controlar o carregamento do formulário
  const [error, setError] = useState(null); // Estado para armazenar mensagens de erro
  const [success, setSuccess] = useState(false); // Estado para controlar o sucesso do envio
  const [modalIsOpen, setModalIsOpen] = useState(false); // Estado para controlar a abertura do modal
  const [alertModalOpen, setAlertModalOpen] = useState(false); // Estado para controlar a abertura do modal de alerta
  const [alertModalContent, setAlertModalContent] = useState({ title: '', message: '', showOkButton: true }); // Estado para armazenar o conteúdo do modal de alerta
  const [statusFilter, setStatusFilter] = useState('Todos'); // Estado para armazenar o filtro de status
  const [categorias, setCategorias] = useState([]); // Estado para armazenar a lista de categorias de itens
  const [itensSolicitados, setItensSolicitados] = useState([{ categoria: '', item: '', quantidade: 1 }]); // Estado para armazenar os itens solicitados
  const [isSendingModalOpen, setIsSendingModalOpen] = useState(false); // Estado para controlar a abertura do modal de envio
  const [quantityErrorModalOpen, setQuantityErrorModalOpen] = useState(false); // Estado para controlar a abertura do modal de erro de quantidade
  const [quantityErrorMessage, setQuantityErrorMessage] = useState(''); // Estado para armazenar a mensagem de erro de quantidade
  const [modalData, setModalData] = useState({ titulo: '', descricao: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);


  const NOTIFICATION_API_URL = import.meta.env.VITE_NOTIFICATION_API_URL;

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'modals', 'infoSolicitaTi'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        // Verifica se o status é true e o cargo não é "T.I"
        if (data.status && currentUserRole !== 'T.I') {
          setModalData({ titulo: data.titulo, descricao: data.descricao });
          setIsModalOpen(true);
        }
      }
    });

    return () => unsubscribe(); // Limpa o listener ao desmontar
  }, [currentUserRole]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleAddItem = () => {
    if (itensSolicitados.length < 3) { // Permite adicionar até 3 itens
      setItensSolicitados([...itensSolicitados, { categoria: '', item: '', quantidade: 1 }]); // Adiciona um novo item
    } else {
      setAlertModalContent({ title: 'Atenção', message: 'Você só pode adicionar até 3 itens.', showOkButton: true });
      setAlertModalOpen(true); // Abre o modal de alerta se o limite for atingido
    }
  };

  // Função para buscar o preço de cada item no Firestore
  const getItemPrice = async (categoria, item) => {
    const estoqueRef = doc(db, 'estoqueTi', 'estoque'); // Referência ao documento de estoque no Firestore
    const estoqueDoc = await getDoc(estoqueRef); // Obtém o documento do Firestore
    if (estoqueDoc.exists()) {
      const categoriaData = estoqueDoc.data()[categoria]; // Obtém os dados da categoria
      if (categoriaData && categoriaData[item]) {
        return categoriaData[item].price || 0; // Retorna o preço ou 0 se não estiver definido
      }
    }
    return 0; // Retorna 0 se o item não for encontrado
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Impede o comportamento padrão do formulário

    if (!validateForm()) { // Verifica se o formulário é válido antes de enviar
      return;
    }

    setLoading(true); // Inicia o estado de carregamento
    setIsSendingModalOpen(true); // Abre o modal de envio

    try {
      const numSolicite = await getNextSolicitacaoNumber(); // Gera o próximo número de solicitação

      const itensAgrupados = itensSolicitados.reduce((acc, { item, quantidade }) => {
        acc[item] = quantidade; // Agrupa os itens solicitados
        return acc;
      }, {});

      const itemPrices = {}; // Objeto para armazenar os preços unitários
      let totalPrice = 0; // Variável para armazenar o preço total

      // Busca o preço unitário de cada item e calcula o total
      for (const [itemName, quantity] of Object.entries(itensAgrupados)) {
        const estoqueRef = doc(db, 'estoqueTi', 'estoque'); // Referência ao documento de estoque
        const estoqueDoc = await getDoc(estoqueRef); // Obtém o documento do Firestore
        const categoriaData = estoqueDoc.data();

        for (const categoria of Object.keys(categoriaData)) {
          if (categoriaData[categoria][itemName]) {
            const itemData = categoriaData[categoria][itemName];
            const itemPrice = itemData.price || 0;
            itemPrices[itemName] = itemPrice; // Armazena o preço unitário
            totalPrice += itemPrice * quantity; // Calcula o total

            if (quantity > itemData.amount) { // Verifica se a quantidade solicitada é maior que a disponível
              setQuantityErrorMessage(`Quantidade que precisa não temos para ${itemName}`);
              setQuantityErrorModalOpen(true); // Abre o modal de erro de quantidade
              setLoading(false); // Encerra o carregamento
              setIsSendingModalOpen(false); // Fecha o modal de envio
              return; // Interrompe o envio da solicitação
            }
            break;
          }
        }
      }

      const novaSolicitacao = {
        tipo,
        motivo,
        whatsapp: currentUser.whatsapp,
        user: currentUser.user,
        cargo: currentUserRole,
        cidade: selectedCidade,
        loja: selectedLoja,
        data: new Date(),
        status: "Pendente",
        numSolicite,
        item: itensAgrupados,
        itemPrice: itemPrices, // Adiciona os preços unitários
        totalPrice: totalPrice.toFixed(2) // Adiciona o preço total
      };

      await setDoc(doc(db, 'solicitTi', numSolicite), novaSolicitacao); // Grava a nova solicitação no Firestore

      // Enviar notificações para todos os usuários com cargo "T.I"
      const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));

      let tokensParaNotificar = [];

      usuariosSnapshot.forEach(cidadeDoc => {
        const cidadeData = cidadeDoc.data();

        Object.keys(cidadeData).forEach(usuarioKey => {
          const usuarioData = cidadeData[usuarioKey];

          if (usuarioData.cargo === 'T.I' && Array.isArray(usuarioData.token)) {
            tokensParaNotificar.push(...usuarioData.token); // Coleta todos os tokens de notificação associados ao usuário
          }
        });
      });

      if (tokensParaNotificar.length > 0) {
        const notificationMessage = {
          title: `Nova Solicitação ${numSolicite}`,
          body: `Uma nova solicitação foi criada: ${tipo}`,
          click_action: "https://drogalira.com.br/solicitati",
          icon: "https://iili.io/duTTt8Q.png"
        };

        const response = await fetch(NOTIFICATION_API_URL, { // Usando a variável de ambiente
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ tokens: tokensParaNotificar, notification: notificationMessage })
        });

        const result = await response.json();
      } else {
        console.log('Nenhum token encontrado para o cargo "T.I".'); // Loga se não houver tokens para notificar
      }

      // Gravação no relatório
      const fullReportRef = doc(db, 'relatorioTi', 'fullReport');
      const fullReportDoc = await getDoc(fullReportRef);
      const fullReportData = fullReportDoc.exists() ? fullReportDoc.data() : {};
      const timestamp = new Date().toISOString();

      const reportEntry = {
        usuario: currentUser.user,
        loja: selectedLoja,
        numSolicite: numSolicite,
        data: new Date().toISOString(),
        cargo: currentUserRole
      };

      await setDoc(fullReportRef, {
        ...fullReportData,
        [timestamp]: {
          [tipo]: reportEntry
        }
      });

      setSuccess(true); // Define o estado de sucesso
      setAlertModalContent({ title: 'Sucesso', message: 'Solicitação enviada com sucesso!', showOkButton: true });





    } catch (error) {
      setError('Erro ao adicionar solicitação'); // Define o estado de erro
      setAlertModalContent({ title: 'Erro', message: 'Erro ao adicionar solicitação', showOkButton: true });
      console.error('Erro ao adicionar solicitação:', error); // Loga o erro
    } finally {
      setLoading(false); // Encerra o estado de carregamento
      setIsSendingModalOpen(false); // Fecha o modal de envio
      setModalIsOpen(false); // Fechar o modal após o envio
      // Limpar os campos após o envio
      setTipo('Reposição');
      setNomeItem('');
      setMotivo('');
      setSelectedCidade('');
      setSelectedLoja('');
      setItensSolicitados([{ categoria: '', item: '', quantidade: 1 }]);

    }
  };

  const handleRemoveItem = (index) => {
    if (itensSolicitados.length > 1) {
      const novosItens = itensSolicitados.filter((_, i) => i !== index); // Remove o item selecionado
      setItensSolicitados(novosItens); // Atualiza o estado dos itens solicitados
    } else {
      setAlertModalContent({ title: 'Atenção', message: 'Você deve ter pelo menos um item na solicitação.', showOkButton: true });
      setAlertModalOpen(true); // Abre o modal de alerta se houver tentativa de remover o único item
    }
  };

  useEffect(() => {
    const fetchCategorias = async () => {
      const estoqueRef = doc(db, 'estoqueTi', 'estoque'); // Referência ao documento de estoque no Firestore
      const estoqueDoc = await getDoc(estoqueRef); // Obtém o documento de estoque
      if (estoqueDoc.exists()) {
        setCategorias(Object.keys(estoqueDoc.data())); // Atualiza o estado com as categorias de itens
      }
    };
    fetchCategorias(); // Chama a função para buscar as categorias
  }, []);

  useEffect(() => {
    const fetchItens = async (categoria) => {
      if (categoria) {
        const estoqueRef = doc(db, 'estoqueTi', 'estoque'); // Referência ao documento de estoque no Firestore
        const estoqueDoc = await getDoc(estoqueRef); // Obtém o documento de estoque
        if (estoqueDoc.exists()) {
          const categoriaData = estoqueDoc.data()[categoria]; // Obtém os dados da categoria selecionada
          return Object.keys(categoriaData); // Retorna a lista de itens da categoria
        }
      }
      return []; // Retorna uma lista vazia se a categoria não for selecionada
    };

    const atualizarItens = async () => {
      const novosItensSolicitados = await Promise.all(
        itensSolicitados.map(async (solicitado) => {
          if (solicitado.categoria) {
            const itensDaCategoria = await fetchItens(solicitado.categoria); // Busca os itens da categoria
            return { ...solicitado, itensDisponiveis: itensDaCategoria }; // Atualiza os itens disponíveis
          }
          return solicitado; // Retorna o item solicitado sem alteração
        })
      );
      setItensSolicitados(novosItensSolicitados); // Atualiza o estado dos itens solicitados
    };

    if (itensSolicitados.length > 0) {
      atualizarItens(); // Chama a função para atualizar os itens disponíveis
    }
  }, [JSON.stringify(itensSolicitados)]); // Executa o efeito sempre que os itens solicitados forem alterados

  useEffect(() => {
    const fetchUserDetails = async () => {
      const usuariosRef = collection(db, 'usuarios'); // Referência à coleção de usuários no Firestore
      const querySnapshot = await getDocs(usuariosRef); // Obtém todos os documentos da coleção de usuários
      querySnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData && userData[currentUser]) {
          setWhatsapp(userData[currentUser].whatsapp || ''); // Atualiza o número de WhatsApp do usuário
        }
      });
    };

    fetchUserDetails(); // Chama a função para buscar os detalhes do usuário
  }, [currentUser]);

  useEffect(() => {
    const fetchCidades = async () => {
      const cidadesRef = doc(db, 'ordersControl', 'cidades'); // Referência ao documento de controle de cidades
      const cidadesDoc = await getDoc(cidadesRef); // Obtém o documento de cidades
      if (cidadesDoc.exists()) {
        const cidadesData = cidadesDoc.data();
        if (currentUserRole === 'Supervisor') {
          setCidades(Object.keys(cidadesData)); // Atualiza a lista de cidades se o usuário for Supervisor
        } else {
          const userCity = currentUser.cidade;
          if (userCity && cidadesData[userCity]) {
            setCidades([userCity]); // Define a cidade do usuário se não for Supervisor
            setSelectedCidade(userCity);
          } else {
            setCidades([]); // Limpa a lista de cidades se nenhuma for encontrada
          }
        }
      }
    };

    fetchCidades(); // Chama a função para buscar as cidades
  }, [currentUser, currentUserRole]);

  useEffect(() => {
    const fetchLojas = async () => {
      const lojasRef = doc(db, 'ordersControl', 'cidades'); // Referência ao documento de controle de cidades
      const lojasDoc = await getDoc(lojasRef); // Obtém o documento de cidades
      if (lojasDoc.exists()) {
        const lojasData = lojasDoc.data();
        if (currentUserRole === 'Supervisor') {
          let allLojas = [];
          Object.keys(lojasData).forEach(city => {
            allLojas = [...allLojas, ...lojasData[city]]; // Coleta todas as lojas
          });
          setLojas(allLojas); // Atualiza a lista de lojas
        } else if (selectedCidade && lojasData[selectedCidade]) {
          setLojas(lojasData[selectedCidade]); // Define as lojas da cidade selecionada
        } else {
          setLojas([]); // Limpa a lista de lojas se nenhuma for encontrada
        }
      }
    };

    if (currentUserRole === 'Supervisor' || selectedCidade) {
      fetchLojas(); // Chama a função para buscar as lojas se o usuário for Supervisor ou se uma cidade for selecionada
    }
  }, [selectedCidade, currentUserRole]);

  useEffect(() => {
    if (selectedCidade) {
      const fetchLojas = async () => {
        const lojasRef = doc(db, 'ordersControl', 'cidades'); // Referência ao documento de controle de cidades
        const lojasDoc = await getDoc(lojasRef); // Obtém o documento de cidades
        if (lojasDoc.exists()) {
          setLojas(lojasDoc.data()[selectedCidade] || []); // Define as lojas da cidade selecionada
        }
      };

      fetchLojas(); // Chama a função para buscar as lojas da cidade selecionada
    } else {
      setLojas([]); // Limpa a lista de lojas se nenhuma cidade for selecionada
    }
  }, [selectedCidade]);

  const getNextSolicitacaoNumber = async () => {
    const soliciteControlRef = doc(db, 'ordersControl', 'soliciteTi'); // Referência ao documento de controle de solicitações
    try {
      const result = await runTransaction(db, async (transaction) => {
        const soliciteDoc = await transaction.get(soliciteControlRef); // Obtém o documento de controle de solicitações
        if (!soliciteDoc.exists()) {
          throw "Documento de controle de solicitações não encontrado!";
        }

        const soliciteControl = soliciteDoc.data().soliciteControl;
        const lastSolicitacao = soliciteControl[soliciteControl.length - 1];

        let prefix = lastSolicitacao.slice(0, 3); // Extrai o prefixo (STIA, STIB, etc.)
        let lastNumber = parseInt(lastSolicitacao.slice(3), 10); // Extrai o número (001, 002, etc.)

        if (lastNumber >= 999) {
          prefix = String.fromCharCode(prefix.charCodeAt(2) + 1).padStart(3, 'C');
          lastNumber = 1; // Reinicia o número para 001
        } else {
          lastNumber += 1; // Incrementa o número
        }

        const newSolicitacao = `${prefix}${String(lastNumber).padStart(3, '0')}`; // Gera o novo número de solicitação

        soliciteControl.push(newSolicitacao); // Adiciona a nova solicitação ao controle
        transaction.update(soliciteControlRef, { soliciteControl }); // Atualiza o documento de controle

        return newSolicitacao; // Retorna o novo número de solicitação
      });
      return result;
    } catch (error) {
      console.error("Erro ao gerar o próximo número de solicitação: ", error); // Loga o erro se houver falha na geração do número
      throw error; // Lança o erro para tratamento posterior
    }
  };

  const handleExternalSubmit = () => {
    const form = document.getElementById('soliciteForm');
    if (form) {
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); // Dispara o evento de submissão do formulário
    }
  };

  const transitions = useTransition(modalIsOpen, {
    from: { opacity: 0, transform: 'translateY(-50%)' },
    enter: { opacity: 1, transform: 'translateY(0%)' },
    leave: { opacity: 0, transform: 'translateY(-50%)' },
  });

  const validateForm = () => {
    if (!tipo || !motivo || !selectedCidade || !selectedLoja || itensSolicitados.some(item => !item.categoria || !item.item || item.quantidade < 1)) {
      setAlertModalContent({ title: 'Atenção', message: 'Por favor, preencha todos os campos antes de enviar.', showOkButton: true });
      setAlertModalOpen(true); // Abre o modal de alerta se o formulário estiver incompleto
      return false; // Retorna falso se a validação falhar
    }
    return true; // Retorna verdadeiro se o formulário for válido
  };

  return (
    <div className="flex bg-altBlue lg:justify-between lg:flex-row flex-col">
      {currentUserRole !== 'T.I' && (
        <div id='criadorDeSolicitacao'>
          <div className="pt-20 hidden lg:block">
            <div className='p-5 bg-white border min-w-[400px] lg:ml-[8rem] m-4 lg:m-0 border-gray-300 rounded-xl shadow-lg'>
              <div className='flex justify-between'>
                <h2 className="text-xl font-bold mb-4 block text-gray-700">Nova Solicitação</h2>
                <button
                  type="button"
                  onClick={handleExternalSubmit}
                  className="max-w-20 gap-1 flex justify-center items-center bg-primaryBlueDark text-white p-2 rounded hover:bg-primaryOpaci focus:outline-none focus:ring focus:ring-gray-200"
                  disabled={loading}
                >
                  <p>{loading ? 'Enviando...' : 'Enviar'}</p>
                  <IoIosSend />
                </button>

              </div>
              <form id="soliciteForm" onSubmit={handleSubmit} className="space-y-2">
                <div className='flex gap-2 flex-col'>
                  <div className="">
                    <Dropdown
                      label="Tipo de Solicitação"
                      options={['Reposição', 'Novo']}
                      selected={tipo}
                      onSelectedChange={(option) => setTipo(option)}
                      required
                    />
                  </div>
                  {itensSolicitados.map((solicitado, index) => (
                    <div key={index} className="flex gap-2 items-center -mt-1">
                      <Dropdown
                        options={categorias}
                        selected={solicitado.categoria || "Categoria"}
                        onSelectedChange={(categoria) => {
                          const novosItens = [...itensSolicitados];
                          novosItens[index].categoria = categoria;
                          novosItens[index].item = ''; // Resetar item ao mudar de categoria
                          setItensSolicitados(novosItens);
                        }}
                      />
                      <div className='min-w-36'>
                        <Dropdown
                          options={solicitado.itensDisponiveis || []}
                          selected={solicitado.item || "item"}
                          onSelectedChange={async (item) => {
                            const novosItens = [...itensSolicitados];
                            novosItens[index].item = item;

                            // Buscar o limite de quantidade do item selecionado
                            const estoqueRef = doc(db, 'estoqueTi', 'estoque');
                            const estoqueDoc = await getDoc(estoqueRef);
                            if (estoqueDoc.exists()) {
                              const categoriaData = estoqueDoc.data()[novosItens[index].categoria];
                              const itemData = categoriaData[item];

                              if (itemData && itemData.quantityLimit !== undefined) {
                                novosItens[index].quantidadeLimite = itemData.quantityLimit;
                              } else {
                                novosItens[index].quantidadeLimite = 0;
                              }
                            }

                            setItensSolicitados(novosItens);
                          }}
                          disabled={!solicitado.categoria}
                        />
                      </div>
                      <div className="mt-2 flex items-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (!solicitado.categoria || !solicitado.item) {
                              setAlertModalContent({ title: 'Atenção', message: 'Selecione uma categoria e um item antes de definir a quantidade.', showOkButton: true });
                              setAlertModalOpen(true);
                              return;
                            }

                            const novosItens = [...itensSolicitados];
                            const limite = solicitado.quantidadeLimite;

                            if (solicitado.quantidade > 1) {
                              novosItens[index].quantidade -= 1;
                              setItensSolicitados(novosItens);
                            } else {
                              setAlertModalContent({ title: 'Atenção', message: 'A quantidade mínima é 1.', showOkButton: true });
                              setAlertModalOpen(true);
                            }
                          }}
                          className="bg-gray-300 text-black p-2 rounded-l"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          label="Qtd"
                          value={solicitado.quantidade}
                          onChange={(e) => {
                            const value = parseInt(e.target.value, 10);

                            if (!solicitado.categoria || !solicitado.item) {
                              setAlertModalContent({ title: 'Atenção', message: 'Selecione uma categoria e um item antes de definir a quantidade.', showOkButton: true });
                              setAlertModalOpen(true);
                              return;
                            }

                            const novosItens = [...itensSolicitados];
                            const limite = solicitado.quantidadeLimite;

                            if (limite !== undefined && value <= limite) {
                              novosItens[index].quantidade = value;
                              setItensSolicitados(novosItens);
                            } else {
                              setQuantityErrorMessage(`Quantidade que precisa não temos para ${solicitado.item}`);
                              setQuantityErrorModalOpen(true);
                            }
                          }}
                          className="w-12 border-t border-b border-gray-300 p-2 text-center focus:ring focus:ring-blue-200"
                          min="1"
                          required
                        />

                        <button
                          type="button"
                          onClick={() => {
                            if (!solicitado.categoria || !solicitado.item) {
                              setAlertModalContent({ title: 'Atenção', message: 'Selecione uma categoria e um item antes de definir a quantidade.', showOkButton: true });
                              setAlertModalOpen(true);
                              return;
                            }

                            const novosItens = [...itensSolicitados];
                            const limite = solicitado.quantidadeLimite;

                            if (limite !== undefined && solicitado.quantidade < limite) {
                              novosItens[index].quantidade += 1;
                              setItensSolicitados(novosItens);
                            } else {
                              setAlertModalContent({ title: 'Atenção', message: `Você não pode pedir mais que ${limite || 0} deste item`, showOkButton: true });
                              setAlertModalOpen(true);
                            }
                          }}
                          className="bg-gray-300 text-black p-2 rounded-r"
                        >
                          +
                        </button>
                      </div>
                      <div className='mt-2'>
                        {itensSolicitados.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="bg-red-500 text-white p-2 rounded mr-1"
                          >
                            -
                          </button>
                        )}
                        {index === itensSolicitados.length - 1 && itensSolicitados.length < 3 && (
                          <button
                            type="button"
                            onClick={handleAddItem}
                            className="bg-primaryBlueDark text-white p-2 rounded"
                          >
                            +
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
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
                      openDirection='up'
                    />
                  </div>
                  <div className='w-24'>
                    <Dropdown
                      label="Loja"
                      options={lojas}
                      selected={selectedLoja || "Loja"}
                      onSelectedChange={(option) => setSelectedLoja(option)}
                      required
                      openDirection='up'
                    />
                  </div>
                </div>
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
                className="modal flex items-center justify-center"
                overlayClassName="overlay"
                style={{
                  overlay: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
                  content: { transition: 'opacity 0.3s ease-in-out' }
                }}
              >
                <animated.div style={styles}>
                  <div className='p-3 bg-white border min-w-[150px] border-gray-300 rounded-xl shadow-lg '>
                    <div className='flex justify-between'>
                      <button
                        type="button"
                        onClick={() => setModalIsOpen(false)}
                        className="flex justify-center items-center bg-secRed text-white p-2 h-8 w-8 rounded-full hover:bg-red-700 shadow-xl"
                        disabled={loading}
                      >
                        <p>X</p>
                      </button>
                      <h2 className="text-xl font-bold mb-4 block text-gray-700">Nova Solicitação</h2>

                      <button
                        type="button"
                        onClick={handleExternalSubmit}
                        className="max-w-20 shadow-lg gap-1 flex justify-center items-center bg-primaryBlueDark text-white p-2 rounded hover:bg-primaryOpaci focus:outline-none focus:ring focus:ring-gray-200"
                        disabled={loading}
                      >
                        <p>{loading ? 'Enviando...' : 'Enviar'}</p>
                        <IoIosSend />
                      </button>

                    </div>
                    <form id="soliciteForm" onSubmit={handleSubmit} className="space-y-2">
                      <div className='flex gap-2 flex-col'>
                        <div className="">
                          <Dropdown
                            label="Tipo de Solicitação"
                            options={['Reposição', 'Novo']}
                            selected={tipo}
                            onSelectedChange={(option) => setTipo(option)}
                            required
                          />
                        </div>
                        {itensSolicitados.map((solicitado, index) => (

                          <div className='flex justify-center'>
                            <div className='w-[70%]'>
                              <div key={index} className="flex gap-2 items-center -mt-1">
                                <div className='text-sm'>
                                  <Dropdown
                                    className="text-sm"
                                    options={categorias}
                                    selected={solicitado.categoria || "Categoria"}
                                    onSelectedChange={(categoria) => {
                                      const novosItens = [...itensSolicitados];
                                      novosItens[index].categoria = categoria;
                                      novosItens[index].item = ''; // Resetar item ao mudar de categoria
                                      setItensSolicitados(novosItens);
                                    }}
                                  />
                                </div>
                                <div className="mt-2 flex items-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!solicitado.categoria || !solicitado.item) {
                                        setAlertModalContent({ title: 'Atenção', message: 'Selecione uma categoria e um item antes de definir a quantidade.', showOkButton: true });
                                        setAlertModalOpen(true);
                                        return;
                                      }

                                      const novosItens = [...itensSolicitados];
                                      const limite = solicitado.quantidadeLimite;

                                      if (solicitado.quantidade > 1) {
                                        novosItens[index].quantidade -= 1;
                                        setItensSolicitados(novosItens);
                                      } else {
                                        setAlertModalContent({ title: 'Atenção', message: 'A quantidade mínima é 1.', showOkButton: true });
                                        setAlertModalOpen(true);
                                      }
                                    }}
                                    className="bg-gray-300 text-black p-2 rounded-l"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    label="Qtd"
                                    value={solicitado.quantidade}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value, 10);

                                      if (!solicitado.categoria || !solicitado.item) {
                                        setAlertModalContent({ title: 'Atenção', message: 'Selecione uma categoria e um item antes de definir a quantidade.', showOkButton: true });
                                        setAlertModalOpen(true);
                                        return;
                                      }

                                      const novosItens = [...itensSolicitados];
                                      const limite = solicitado.quantidadeLimite;

                                      if (limite !== undefined && value <= limite) {
                                        novosItens[index].quantidade = value;
                                        setItensSolicitados(novosItens);
                                      } else {
                                        setAlertModalContent({ title: 'Atenção', message: `Você não pode pedir mais que ${limite || 0} deste item`, showOkButton: true });
                                        setAlertModalOpen(true);
                                      }
                                    }}
                                    className="w-12 border-t border-b border-gray-300 p-2 text-center focus:ring focus:ring-blue-200"
                                    min="1"
                                    required
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!solicitado.categoria || !solicitado.item) {
                                        setAlertModalContent({ title: 'Atenção', message: 'Selecione uma categoria e um item antes de definir a quantidade.', showOkButton: true });
                                        setAlertModalOpen(true);
                                        return;
                                      }

                                      const novosItens = [...itensSolicitados];
                                      const limite = solicitado.quantidadeLimite;

                                      if (limite !== undefined && solicitado.quantidade < limite) {
                                        novosItens[index].quantidade += 1;
                                        setItensSolicitados(novosItens);
                                      } else {
                                        setAlertModalContent({ title: 'Atenção', message: `Você não pode pedir mais que ${limite || 0} deste item`, showOkButton: true });
                                        setAlertModalOpen(true);
                                      }
                                    }}
                                    className="bg-gray-300 text-black p-2 rounded-r"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <div className='text-sm'>
                                <Dropdown
                                  options={solicitado.itensDisponiveis || []}
                                  selected={solicitado.item || "item"}
                                  onSelectedChange={async (item) => {
                                    const novosItens = [...itensSolicitados];
                                    novosItens[index].item = item;

                                    // Buscar o limite de quantidade do item selecionado
                                    const estoqueRef = doc(db, 'estoqueTi', 'estoque');
                                    const estoqueDoc = await getDoc(estoqueRef);
                                    if (estoqueDoc.exists()) {
                                      const categoriaData = estoqueDoc.data()[novosItens[index].categoria];
                                      const itemData = categoriaData[item];

                                      if (itemData && itemData.quantityLimit !== undefined) {
                                        novosItens[index].quantidadeLimite = itemData.quantityLimit;
                                      } else {
                                        novosItens[index].quantidadeLimite = 0;
                                      }
                                    }

                                    setItensSolicitados(novosItens);
                                  }}
                                  disabled={!solicitado.categoria}
                                />
                              </div>
                            </div>

                            <div className='h-full mt-1 ml-1'>
                              {itensSolicitados.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(index)}
                                  className="bg-red-500 text-white p-2 rounded mr-1 !h-[90px]"
                                >
                                  -
                                </button>
                              )}
                              {index === itensSolicitados.length - 1 && itensSolicitados.length < 3 && (
                                <button
                                  type="button"
                                  onClick={handleAddItem}
                                  className="bg-primaryBlueDark text-white p-2 rounded !h-[90px]"
                                >
                                  +
                                </button>
                              )}
                            </div>

                          </div>
                        ))}
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
                    </form>
                  </div>
                </animated.div>
              </Modal>
            )
          )}
        </div>
      )}

      <AlertModal
        isOpen={alertModalOpen}
        onRequestClose={() => setAlertModalOpen(false)}
        title={alertModalContent.title}
        message={alertModalContent.message}
        showOkButton={alertModalContent.showOkButton}
      />
      <AlertModal
        isOpen={isSendingModalOpen}
        onRequestClose={() => setIsSendingModalOpen(false)}
        title="Enviando"
        message="Sua solicitação está sendo enviada..."
        showOkButton={false}
        loading={true}
      />
      <AlertModal
        isOpen={quantityErrorModalOpen}
        onRequestClose={() => setQuantityErrorModalOpen(false)}
        title="Quantidade Insuficiente"
        message={quantityErrorMessage}
        showOkButton={true}
      />
      {currentUserRole !== 'T.I' && (
        <div className="">
          <ListaSolicitTi statusFilter={statusFilter} />
        </div>
      )}
      {currentUserRole == 'T.I' && (
        <div className="w-full">
          <AdmListaSolicitTi statusFilter={statusFilter} />
        </div>
      )}
      <NotificationModal />

      <MyModal isOpen={isModalOpen} onClose={handleCloseModal}>
        <h2 className='font-bold text-2xl mb-2'>{modalData.titulo}</h2>
        <div dangerouslySetInnerHTML={{ __html: modalData.descricao }}></div>
      </MyModal>
    </div>
  );
};

export default SoliciteTi;
