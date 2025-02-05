import Anydesk from '../../assets/anydesk.jpeg'

export default function Pbms() {
  return (
    <div className="w-full flex justify-center items-center flex-col gap-8 mx-auto p-4 bg-altBlue rounded-lg  mt-24">
      <div className='rounded-xl'>
        <a href="/assets/pg/AnyDesk_5.exe" download>
          <img className='rounded-xl' src={Anydesk} alt="" />
        </a>
      </div>
    </div>
  );
}
