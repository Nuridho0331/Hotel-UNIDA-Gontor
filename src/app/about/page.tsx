import HeaderSection from '@/app/components/header-section'
import Image from 'next/image'
import {IoEyeOutline, IoLocateOutline} from 'react-icons/io5'

export const metadata = {
    title: 'About Us',
    description: 'Learn more about our company',
  }


const Aboutpage = () => (
    <div>
      <HeaderSection title="About Us"
      subtitle="Learn more about our company" />

      <div className='max-w-screen-xl mx-auto py-20 px-4'>
         <div className= 'grid md:grid-cols-2 gap-8'>
            <Image src="/IMG_0334.JPG" alt="About Image" width={624} height={600} />
            <div>
                <h1 className='text-5xl font-semibold text-gray-800 mb-4'>Tentang Kami</h1>
                <p className='text-gray-600 py-5'>Penginapan berbasis wakaf di lingkungan Universitas Darussalam Gontor</p>
                <ul className='list-item space-y-6 pt-8'>
                    <li className='flex gap-5'>
                        <div className="flex-none mt-1"> 
                            <IoEyeOutline className='size-6' />
                        </div>
                        <div className='flex-1'>
                            <h3 className='text-xl font-semibold text-gray-800'>Visi</h3>
                            <p className='text-gray-600 pt-2'>Menjadi sarana akomodasi dan hospitality terpercaya di lingkungan perguruan 
                                tinggi pesantren yang mengedepankan kenyamanan dan profesionalisme layanan..</p>
                        </div>
                    </li>


                    <li className='flex gap-5'>
                        <div className="flex-none mt-1"> 
                            <IoLocateOutline className='size-6' />
                        </div>
                        <div className='flex-1'>
                            <h3 className='text-xl font-semibold text-gray-800'>Misi</h3>
                            <p className='text-gray-600 pt-2'>Menyediakan akomodasi yang bersih, nyaman, 
                                dan tenang bagi seluruh tamu serta sivitas akademika.</p>
                        </div>
                            </li>

                </ul>
            </div>
         </div>
      </div>
    </div>
    )

export default Aboutpage
