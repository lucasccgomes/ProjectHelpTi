import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../firebase";
import MyModal from "../MyModal/MyModal";
import AlertModal from "../AlertModal/AlertModal";
import { BsWhatsapp } from "react-icons/bs";

const ListaContatos = () => {
  const [contatos, setContatos] = useState([]);
  const [contatosFiltrados, setContatosFiltrados] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [numerosSelecionados, setNumerosSelecionados] = useState([]);
  const [numerosSelecionadosPorPagina, setNumerosSelecionadosPorPagina] = useState({});
  const [mensagemWhatsApp, setMensagemWhatsApp] = useState("");
  const [telefoneSelecionado, setTelefoneSelecionado] = useState("");
  const [busca, setBusca] = useState("");
  const [bloqueioMultiMensagem, setBloqueioMultiMensagem] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(0);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [nomeSelecionado, setNomeSelecionado] = useState("");
  const [contadorAtualizacoes, setContadorAtualizacoes] = useState(
    parseInt(localStorage.getItem("contadorAtualizacoes")) || 0
  );
  const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false);
  const [nomeLista, setNomeLista] = useState("");
  const [isMyListsModalOpen, setIsMyListsModalOpen] = useState(false);
  const [listas, setListas] = useState([]);
  const [contatosDaLista, setContatosDaLista] = useState([]);
  const [isViewListModalOpen, setIsViewListModalOpen] = useState(false);
  const [nomeListaVisualizada, setNomeListaVisualizada] = useState("");

  const CONTATOS_POR_PAGINA = 15;
  const TEMPO_BLOQUEIO = 90 * 60 * 1000; // 90 minutos em milissegundos

  const formatarNumero = (numero) => {
    // Remove caracteres não numéricos
    const numeroFormatado = numero.replace(/\D/g, "");

    // Adiciona o código do país se não estiver presente
    if (!numeroFormatado.startsWith("55")) {
      return `55${numeroFormatado}`;
    }

    return numeroFormatado;
  };

  const carregarListas = async () => {
    try {
      const listasSnapshot = await getDocs(collection(db, "webPanfleto", "ContatoLista", "listas"));
      const listasObtidas = listasSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setListas(listasObtidas);
    } catch (error) {
      console.error("Erro ao carregar listas:", error);
      setAlertTitle("Erro");
      setAlertMessage("Erro ao carregar listas. Tente novamente.");
      setIsAlertModalOpen(true);
    }
  };

  useEffect(() => {
    const buscarContatos = async () => {
      const contatosLocal = localStorage.getItem("contatos");
      const contador = parseInt(localStorage.getItem("contadorAtualizacoes")) || 0;

      if (contatosLocal && contador < 8) {
        // Carrega contatos do localStorage
        const contatosArmazenados = JSON.parse(contatosLocal);
        setContatos(contatosArmazenados);
        setContatosFiltrados(contatosArmazenados);
      } else {
        // Consulta o banco de dados e atualiza o localStorage
        const contatosSnapshot = await getDocs(collection(db, "webPanfleto"));
        const contatosLista = contatosSnapshot.docs.map((doc) => doc.data());
        setContatos(contatosLista);
        setContatosFiltrados(contatosLista);
        localStorage.setItem("contatos", JSON.stringify(contatosLista));
        localStorage.setItem("contadorAtualizacoes", 0); // Reseta o contador ao atualizar
        setContadorAtualizacoes(0);
      }
    };

    buscarContatos();
  }, []);

  useEffect(() => {
    const contador = parseInt(localStorage.getItem("contadorAtualizacoes")) || 0;
    const novoContador = contador + 1;

    localStorage.setItem("contadorAtualizacoes", novoContador);
    setContadorAtualizacoes(novoContador);
  }, []);

  useEffect(() => {
    // Atualiza o contador do tempo restante para desbloqueio
    let timer;
    if (bloqueioMultiMensagem && tempoRestante > 0) {
      timer = setInterval(() => {
        setTempoRestante((prev) => prev - 1);
      }, 1000);
    }
    if (tempoRestante <= 0) {
      setBloqueioMultiMensagem(false);
    }
    return () => clearInterval(timer);
  }, [bloqueioMultiMensagem, tempoRestante]);

  const alternarSelecao = (numero) => {
    setNumerosSelecionadosPorPagina((prev) => {
      const selecionadosPagina = prev[paginaAtual] || [];
      if (selecionadosPagina.includes(numero)) {
        return {
          ...prev,
          [paginaAtual]: selecionadosPagina.filter((n) => n !== numero),
        };
      } else {
        if (
          Object.values(prev).flat().length >= 600
        ) {
          setAlertTitle("Limite de Seleção");
          setAlertMessage("Você só pode selecionar até 600 contatos.");
          setIsAlertModalOpen(true);
          return prev;
        }
        return {
          ...prev,
          [paginaAtual]: [...selecionadosPagina, numero],
        };
      }
    });
  };

  const enviarMensagensWhatsApp = async () => {
    if (numerosSelecionados.length === 0) {
      setAlertTitle("Nenhum número selecionado");
      setAlertMessage("Por favor, selecione pelo menos um número.");
      setIsAlertModalOpen(true);
      return;
    }
  
    try {
      const promises = numerosSelecionados.map((numero) =>
        fetch("https://api.drogalira.com.br/wbot/api/send-message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            numero: formatarNumero(numero),
            mensagem: mensagemWhatsApp,
          }),
        })
          .then(async (res) => {
            if (!res.ok) {
              const erro = await res.text();
              throw new Error(`Erro para ${numero}: ${erro}`);
            }
            return res.json();
          })
          .catch((error) => {
            console.error(`Erro no número ${numero}:`, error.message);
            return { numero, erro: error.message };
          })
      );
  
      const resultados = await Promise.all(promises);
  
      const erros = resultados.filter((res) => res.erro);
      if (erros.length > 0) {
        setAlertTitle("Erro parcial");
        setAlertMessage(
          `Algumas mensagens falharam: ${erros.map((e) => e.numero).join(", ")}`
        );
      } else {
        setAlertTitle("Sucesso");
        setAlertMessage("Mensagens enviadas com sucesso!");
      }
    } catch (error) {
      console.error("Erro geral ao enviar mensagens:", error);
      setAlertTitle("Erro inesperado");
      setAlertMessage("Houve um erro inesperado ao enviar mensagens.");
    } finally {
      setIsAlertModalOpen(true);
      setIsWhatsAppModalOpen(false);
    }
  };
  
  // Envio direto com botão WhatsApp
  const abrirModalWhatsApp = (telefone, nome) => {
    setIsAlertModalOpen(false); // Fecha o modal de alerta
    setIsCreateListModalOpen(false); // Fecha o modal de criação
    setIsMyListsModalOpen(false); // Fecha o modal de listas
    setIsViewListModalOpen(false); // Fecha o modal de visualização
    setTelefoneSelecionado(telefone);
    setNomeSelecionado(nome || "Sem Nome");
    setMensagemWhatsApp("");
    setIsWhatsAppModalOpen(true); // Abre o modal de envio de mensagem
  };
  
  const enviarMensagemWhatsAppUnica = async () => {
    if (!mensagemWhatsApp) {
      setAlertTitle("Mensagem vazia");
      setAlertMessage("Por favor, escreva uma mensagem.");
      setIsAlertModalOpen(true);
      return;
    }
  
    try {
      const resposta = await fetch("https://api.drogalira.com.br/wbot/api/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numero: formatarNumero(telefoneSelecionado),
          mensagem: mensagemWhatsApp,
        }),
      });
  
      if (!resposta.ok) {
        const erroDetalhes = await resposta.text();
        throw new Error(`Erro HTTP ${resposta.status}: ${erroDetalhes}`);
      }
  
      const resultado = await resposta.json();
  
      setAlertTitle("Sucesso");
      setAlertMessage("Mensagem enviada com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setAlertTitle("Erro inesperado");
      setAlertMessage(`Erro ao enviar a mensagem: ${error.message}`);
    } finally {
      setIsAlertModalOpen(true);
      setIsWhatsAppModalOpen(false);
    }
  };
  
  
  const filtrarContatos = (e) => {
    const termo = e.target.value.toLowerCase();
    setBusca(termo);

    const filtrados = contatos.filter((contato) => {
      const nome = contato.nome ? contato.nome.toLowerCase() : "";
      const telefone = contato.telefone ? contato.telefone.toLowerCase() : "";
      return nome.includes(termo) || telefone.includes(termo);
    });

    setContatosFiltrados(filtrados);
    setPaginaAtual(0); // Reseta para a primeira página após a busca
  };


  const contatosPaginados = contatosFiltrados.slice(
    paginaAtual * CONTATOS_POR_PAGINA,
    (paginaAtual + 1) * CONTATOS_POR_PAGINA
  );

  return (
    <div className="p-4 bg-white m-4 rounded-2xl shadow-md">
      <div>
        <h2 className="text-lg font-bold mb-4">Lista de Contatos</h2>
        <div className="flex justify-end mb-4 gap-4">
          <button
            className="bg-green-500 text-white px-4 py-2 rounded"
            onClick={() => {
              carregarListas();
              setIsMyListsModalOpen(true);
            }}
          >
            Minhas Listas
          </button>
          <button
            className={`bg-blue-500 text-white px-4 py-2 rounded ${Object.values(numerosSelecionadosPorPagina).flat().length === 0
              ? "opacity-50 cursor-not-allowed"
              : ""
              }`}
            onClick={() => setIsCreateListModalOpen(true)}
            disabled={Object.values(numerosSelecionadosPorPagina).flat().length === 0}
          >
            Criar Lista
          </button>
        </div>

        <input
          type="text"
          value={busca}
          onChange={filtrarContatos}
          placeholder="Buscar contato..."
          className="border border-gray-300 rounded p-2 w-full mb-4"
        />
        {Object.values(numerosSelecionadosPorPagina).flat().length > 0 && (
          <div className="mb-4">
            <h3 className="text-md font-semibold mb-2">Contatos Selecionados:</h3>
            <div className="flex flex-wrap gap-2">
              {Object.values(numerosSelecionadosPorPagina)
                .flat()
                .map((numero) => {
                  const contato = contatos.find((c) => c.telefone === numero);
                  const nome = contato?.nome || "Sem Nome";
                  const nomeExibido = nome.length > 6 ? `${nome.slice(0, 6)}...` : nome;

                  return (
                    <div
                      key={numero}
                      className="bg-gray-200 text-gray-800 px-3 py-1 rounded flex items-center gap-2"
                    >
                      <span>{nomeExibido}</span>
                      <button
                        onClick={() =>
                          setNumerosSelecionadosPorPagina((prev) => {
                            const novaSelecao = Object.keys(prev).reduce((acc, pagina) => {
                              acc[pagina] = prev[pagina].filter((n) => n !== numero);
                              return acc;
                            }, {});
                            return novaSelecao;
                          })
                        }
                        className="text-red-500 font-bold"
                      >
                        X
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
        <div className="mb-4 flex justify-between items-center">
          <span className="text-sm font-medium">
            Total de Contatos: {contatosFiltrados.length}
          </span>
          <span className="text-sm font-medium">
            Página {paginaAtual + 1} de {Math.ceil(contatosFiltrados.length / CONTATOS_POR_PAGINA)}
          </span>
          <span className="text-sm font-medium">
            Total Selecionados: {Object.values(numerosSelecionadosPorPagina).flat().length}
          </span>
        </div>
      </div>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="px-4 py-2">
              <input
                type="checkbox"
                onChange={(e) => {
                  setNumerosSelecionadosPorPagina((prev) => {
                    const selecionadosPagina = prev[paginaAtual] || [];
                    if (e.target.checked) {
                      const novosSelecionados = contatosPaginados
                        .map((contato) => contato.telefone)
                        .filter((numero) => !selecionadosPagina.includes(numero));
                      const totalSelecionados = Object.values(prev).flat().length;
                      if (totalSelecionados + novosSelecionados.length > 600) {
                        setAlertTitle("Limite de Seleção");
                        setAlertMessage("Você só pode selecionar até 600 contatos.");
                        setIsAlertModalOpen(true);
                        return prev;
                      }
                      return {
                        ...prev,
                        [paginaAtual]: [...selecionadosPagina, ...novosSelecionados],
                      };
                    } else {
                      return {
                        ...prev,
                        [paginaAtual]: [],
                      };
                    }
                  });
                }}
                checked={
                  (numerosSelecionadosPorPagina[paginaAtual]?.length || 0) ===
                  contatosPaginados.length
                }
              />
            </th>
            <th className="px-4 py-2">Nome</th>
            <th className="px-4 py-2">Telefone</th>
            <th className="px-4 py-2">Ações</th>
          </tr>
        </thead>
        <tbody>
          {contatosPaginados.map((contato, index) => (
            <tr key={index}>
              <td className="px-4 py-2">
                <input
                  type="checkbox"
                  checked={(numerosSelecionadosPorPagina[paginaAtual] || []).includes(
                    contato.telefone || ""
                  )}
                  onChange={() => alternarSelecao(contato.telefone || "")}
                  disabled={
                    Object.values(numerosSelecionadosPorPagina).flat().length >= 600 &&
                    !(numerosSelecionadosPorPagina[paginaAtual] || []).includes(
                      contato.telefone || ""
                    )
                  }
                />
              </td>
              <td className="px-4 py-2">{contato.nome || "Sem Nome"}</td>
              <td className="px-4 py-2">{contato.telefone || "Sem Telefone"}</td>
              <td className="px-4 py-2 flex items-center justify-center">
                {contato.telefone && (
                  <button
                    className={`bg-green-500 text-white px-2 py-1 rounded ${numerosSelecionados.length > 0 ? "!bg-gray-400 cursor-not-allowed" : ""
                      }`}
                    onClick={() =>
                      abrirModalWhatsApp(formatarNumero(contato.telefone), contato.nome)
                    }
                  >
                    <div className="flex justify-center gap-1 items-center">
                      <BsWhatsapp />
                      <p className="">WhatsApp</p>
                    </div>
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between mt-4">
        <button
          disabled={paginaAtual === 0}
          onClick={() => setPaginaAtual((prev) => prev - 1)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Anterior
        </button>
        <button
          disabled={paginaAtual + 1 >= Math.ceil(contatosFiltrados.length / CONTATOS_POR_PAGINA)}
          onClick={() => {
            setPaginaAtual((prev) => prev + 1);
            const novoContador = contadorAtualizacoes + 1;
            setContadorAtualizacoes(novoContador);
            localStorage.setItem("contadorAtualizacoes", novoContador);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Próximo
        </button>
      </div>
      {numerosSelecionados.length > 0 && (
        <button
          className="fixed bottom-16 right-4 bg-green-500 text-white px-5 py-4 rounded-full shadow-lg"
          onClick={() => setIsWhatsAppModalOpen(true)}
          disabled={bloqueioMultiMensagem}
        >
          {bloqueioMultiMensagem ? (
            `Bloqueado: ${Math.floor(tempoRestante / 60)}m ${tempoRestante % 60}s`
          ) : (
            <>
              <BsWhatsapp className="inline-block mr-2" /> Multi Mensagem
            </>
          )}
        </button>
      )}

      <MyModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
      >
        <h3 className="text-lg font-bold mb-4">
          {numerosSelecionados.length > 1
            ? `Enviar Mensagem para Selecionados (${numerosSelecionados.length})`
            : `Enviar Mensagem para ${nomeSelecionado} (${telefoneSelecionado})`}
        </h3>
        <textarea
          value={mensagemWhatsApp}
          onChange={(e) => setMensagemWhatsApp(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-4"
          rows="4"
          placeholder="Escreva sua mensagem..."
        />
        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={
            numerosSelecionados.length > 1
              ? enviarMensagensWhatsApp // Para múltiplos contatos
              : enviarMensagemWhatsAppUnica // Para um único contato
          }
        >
          Enviar
        </button>
      </MyModal>

      <MyModal
        isOpen={isCreateListModalOpen}
        onClose={() => {
          setIsCreateListModalOpen(false);
          setNomeLista(""); // Limpa o nome da lista ao fechar o modal
        }}
      >
        <h3 className="text-lg font-bold mb-4">Criar Lista</h3>
        <input
          type="text"
          value={nomeLista}
          onChange={(e) => setNomeLista(e.target.value)}
          placeholder="Digite o nome da lista"
          className="w-full p-2 border border-gray-300 rounded mb-4"
        />
        <button
          className={`bg-green-500 text-white px-4 py-2 rounded ${!nomeLista.trim() ? "opacity-50 cursor-not-allowed" : ""
            }`}
          onClick={async () => {
            if (!nomeLista.trim()) return; // Não permite salvar sem nome
            try {
              const contatosSelecionados = Object.values(numerosSelecionadosPorPagina).flat();
              const listaRef = collection(db, "webPanfleto", "ContatoLista", "listas");
              await addDoc(listaRef, {
                nome: nomeLista.trim(),
                contatos: contatosSelecionados,
              });
              setAlertTitle("Sucesso");
              setAlertMessage("Lista Criada com Sucesso!");
              setIsAlertModalOpen(true);
              setIsCreateListModalOpen(false); // Fecha o modal
              setNomeLista(""); // Limpa o nome da lista
            } catch (error) {
              setAlertTitle("Erro");
              setAlertMessage("Erro ao criar a lista. Tente novamente.");
              setIsAlertModalOpen(true);
              console.error("Erro ao criar lista:", error);
            }
          }}
          disabled={!nomeLista.trim()}
        >
          Salvar
        </button>
      </MyModal>

      <MyModal
        isOpen={isMyListsModalOpen}
        onClose={() => setIsMyListsModalOpen(false)}
      >
        <h3 className="text-lg font-bold mb-4">Minhas Listas</h3>
        {listas.length === 0 ? (
          <p className="text-gray-600">Nenhuma lista encontrada.</p>
        ) : (
          <ul className="list-disc pl-5">
            {listas.map((lista) => (
              <li
                key={lista.id}
                className="cursor-pointer text-blue-600 hover:underline mb-2"
                onClick={() => {
                  setNomeListaVisualizada(lista.nome);
                  setContatosDaLista(lista.contatos || []);
                  setIsViewListModalOpen(true);
                  setIsMyListsModalOpen(false);
                }}
              >
                {lista.nome}
              </li>
            ))}
          </ul>
        )}
      </MyModal>

      <MyModal
        isOpen={isViewListModalOpen}
        onClose={() => setIsViewListModalOpen(false)}
      >
        <h3 className="text-lg font-bold mb-4">Contatos da Lista: {nomeListaVisualizada}</h3>
        {contatosDaLista.length === 0 ? (
          <p className="text-gray-600">Nenhum contato nesta lista.</p>
        ) : (
          <ul className="list-disc pl-5">
            {contatosDaLista.map((numero, index) => {
              const contato = contatos.find((c) => c.telefone === numero) || { nome: "Sem Nome", telefone: numero };
              return (
                <li key={index}>
                  {contato.nome} ({contato.telefone})
                </li>
              );
            })}
          </ul>
        )}
      </MyModal>


      <AlertModal
        isOpen={isAlertModalOpen}
        onRequestClose={() => setIsAlertModalOpen(false)}
        title={alertTitle}
        message={alertMessage}
      />

    </div>
  );
};

export default ListaContatos;
