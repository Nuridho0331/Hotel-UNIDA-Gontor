import Card from './Card'

const rooms = [
  {
    id: 1,
    title: 'Triple Deluxe',
    price: 'Rp. 250.000',
    capacity: '2 people',
    image: '/IMG_0340.JPG',
  },
  {
    id: 2,
    title: 'Twin Deluxe',
    price: 'Rp. 350.000',
    capacity: '2 people',
    image: '/IMG_0340.JPG',
  },
  {
    id: 3,
    title: 'Deluxe Room',
    price: 'Rp. 390.000',
    capacity: '2 people',
    image: '/IMG_0340.JPG',
  },
  {
    id: 4,
    title: 'Classic Family',
    price: 'Rp. 360.000',
    capacity: '4 people',
    image: '/IMG_0340.JPG',
  },
  {
    id: 5,
    title: 'VVIP Suite',
    price: 'Rp. 450.000',
    capacity: '4 people',
    image: '/IMG_0340.JPG',
  },
  {
    id: 6,
    title: 'VIP Suite',
    price: 'Rp. 550.000',
    capacity: '5 people',
    image: '/IMG_0340.JPG',
  },
]

const Main = () => {
  return (
    <div className='max-w-screen-xl py-6 pb-20 px-4 mx-auto'>
      <div className='grid gap-7 md:grid-cols-3'>
        {rooms.map((room) => (
          <Card
            key={room.id}
            title={room.title}
            price={room.price}
            capacity={room.capacity}
            image={room.image}
          />
        ))}
      </div>
    </div>
  )
}

export default Main