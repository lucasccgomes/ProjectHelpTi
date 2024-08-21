import CadastroEstoque from "../components/CadastroEstoque/CadastroEstoque";
import EstoqueViewer from "../components/EstoqueViewer/EstoqueViewer";


const Estoque = () => {


  return (
    <div className="min-h-screen flex flex-row items-center justify-center bg-primary text-gray-900 p-4">
      <CadastroEstoque />
      <EstoqueViewer/>
    </div>
  );
};

export default Estoque;
