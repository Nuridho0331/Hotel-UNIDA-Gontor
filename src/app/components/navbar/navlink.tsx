'use client';

import {IoClose, IoMenu} from 'react-icons/io5';
import { useState } from 'react';
import clsx from 'clsx';
import {useSession, signOut} from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

const navlink = () => {
  const [isOpen, setOpen] = useState(false);
  const {data: session} = useSession();

  return (
    <>

      <button onClick={() => setOpen(!isOpen)}
        className="inline-flex items-center p-2 justify-center
        text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100"
      >
        {isOpen ? <IoClose className='size-8' /> : <IoMenu className='size-8' />}
      </button>
      <div className={clsx(
        'w-full md:block md:w-auto',{
          hidden: !isOpen
        }
      )}>
        <ul className='flex flex-col font-semibold text-sm uppercase p-4 mt-4
        rounded-sm bg-gray-50 md:flex-row md:items-center md:space-x-10 md:p-0
        md:mt-0 md:border-0 md:bg-white'>

        <li>
          <Link href='/' className='block py-2 px-3 text-gray-700
          rounded hover:bg-transparent md:p-0'>
            Home
          </Link>
        </li>

        <li>
          <Link href='/about' className='block py-2 px-3 text-gray-700
          rounded hover:bg-transparent md:p-0'>
            About
          </Link>
        </li>

        <li>
          <Link href='/rooms' className='block py-2 px-3 text-gray-700
          rounded hover:bg-transparent md:p-0'>
            Rooms
          </Link>
        </li>

        <li>
          <Link href='/contact' className='block py-2 px-3 text-gray-700
          rounded hover:bg-transparent md:p-0'>
            Contact
          </Link>
        </li>


        {session && (
          <>
          <li>
          <Link href='/my-reservation' className='block py-2 px-3 text-gray-700
          rounded hover:bg-transparent md:p-0'>
            My Reservation
          </Link>
        </li>
          
          {session.user.role === 'admin' && (
          <>
          <li>
          <Link href='/admin/dashboard' className='block py-2 px-3 text-gray-700
          rounded hover:bg-transparent md:p-0'>
            Dashboard
          </Link>
        </li>

         <li>
          <Link href='/admin/manage-rooms' className='block py-2 px-3 text-gray-700
          rounded hover:bg-transparent md:p-0'>
           Manage-room
          </Link>
        </li>
          </>
        )}
          </>
          )}
        
{session ? (
  <li className="pt-2 md:pt-0 md:ml-4">
    <div className="flex items-center gap-2">
      <Image
        src={session.user.image || "/orang.svg"}
        alt="avatar"
        width={48}
        height={48}
        className="rounded-full object-cover"
      />

      <button
        onClick={() => signOut({ callbackUrl: "/signin" })}
        className="py-2 px-4 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-sm cursor-pointer"
      >
        Sign Out
      </button>
    </div>
  </li>
) : (
  <li className="pt-2 md:pt-0 md:ml-4">
    <Link
      href="/signin"
      className="block py-2 px-5 rounded-md font-semibold bg-gold-200 text-gold-800 hover:bg-gold-300 transition-colors"
    >
      Sign In
    </Link>
  </li>
)}
        


  </ul>
      </div>
    </>
  );
}
export default navlink
