import Image from "next/image";
import Link from "next/link";
import Navlink from "./navlink";

const navbar = () => {
  return (
    <div className='fixed top-0 w-full bg-white shadow-md z-20'>
      <div className='max-w-screen-xl mx-auto flex flex-wrap items-center 
      justify-between p-4'>
        <div className='flex items-center justify-between h-16 w-full'>
          <Link href='/'>
            <Image
              src='/logoemas.png'
              alt='Logo'
              width={60}
              height={60}
              priority
            />
          </Link>
          <Navlink />
        </div>
      </div>
    </div>
  );
};

export default navbar;
