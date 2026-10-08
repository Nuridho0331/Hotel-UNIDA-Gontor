import Link from 'next/link'
import Image from 'next/image'

const Hero = () => {
  return (
    <div className="relative h-screen text-white overflow-hidden ">
        <div className="absolute inset-0">
            <Image src='/IMG_0334.JPG' alt='hero image' fill className='object-cover object-center' />
            <div className="absolute inset-0 bg-black opacity-50"></div>
        </div>
        <div className='relative flex flex-col justify-center items-center h-full text-center'>
            <h1 className='text-7xl font-bold mb-4'>Selamat datang di Hotel UNIDA Gontor</h1>
            <p className='text-2xl font-semibold mb-8'>Pesan kamar Anda hari ini!</p>
            <div className='flex gap-5'>
                <Link href = "/rooms" className='bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 md:px-10 text-lg font-medium hover:scale-105 transition duration-300 rounded-lg'>
                    Book Now
                </Link>
            </div>
        </div>
    </div>
  )
}

export default Hero
