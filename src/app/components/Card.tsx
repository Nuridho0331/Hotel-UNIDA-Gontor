import Image from 'next/image'
import Link from 'next/link'
import { IoPeopleOutline } from 'react-icons/io5'

interface CardProps {
  title: string
  price: string
  capacity: string
  image: string
  href?: string
}

const Card = ({ title, price, capacity, image, href = '#' }: CardProps) => {
  return (
    <div className='bg-white shadow-lg rounded-sm transition duration-100 hover:shadow-xl'>
      <div className='h-[260px] rounded-t-sm relative'>
        <Image
          src={image}
          width={384}
          height={256}
          alt={title}
          className='w-full h-full object-cover rounded-t-sm'
        />
      </div>
      <div className='p-8'>
        <h4 className='text-2xl font-medium'>
          <Link href={href} className='hover:text-blue-600 transition duration-150'>
            {title}
          </Link>
        </h4>
        <p className='text-2xl mb-7'>
          <span className='font-semibold text-gray-700'>{price}</span>
          <span className='text-gray-400 text-sm'>/night</span>
        </p>

        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <IoPeopleOutline />
            <span>{capacity}</span>
          </div>
          <Link
            href={href}
            className='px-6 py-2.5 md:px-3 font-semibold text-white bg-blue-500 hover:bg-blue-600 transition duration-150'
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Card