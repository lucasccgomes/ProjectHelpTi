import Funcional from '../../assets/funcional.png'
import Epharma from '../../assets/epharma.png'
import Pdrogaria from '../../assets/pdrogaria.png'

export default function Pbms() {
  return (
    <div className="w-full flex justify-center items-center flex-col gap-8 mx-auto p-4 bg-altBlue rounded-lg  mt-24">
      <div className='w-40 bg-white flex justify-center p-2 rounded-xl shadow-lg'>
        <a href="http://funcionalcard.com.br/autorizadorweb/geral/login.aspx" target='_blank'>
          <img className='rounded-xl max-w-36' src={Funcional} alt="" />
        </a>
      </div>

      <div className='w-40 bg-white flex justify-center p-2 rounded-xl shadow-lg'>
        <a href="https://autorizador.epharma.com.br/#/" target='_blank'>
          <img className='rounded-xl max-w-36' src={Epharma} alt="" />
        </a>
      </div>

      <div className='w-40 bg-white flex justify-center p-2 rounded-xl shadow-lg'>
      <div className='w-40 bg-blue-600 rounded-xl'>
        <a href="https://www.portaldadrogaria.com.br/11v1" target='_blank'>
          <img className='rounded-xl max-w-36' src={Pdrogaria} alt="" />
        </a>
        </div>
      </div>
    </div>
  );
}
