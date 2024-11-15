'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const fruits = [
  { name: 'Cherry', color: 'bg-red-500', symbol: '🍒' },
  { name: 'Lemon', color: 'bg-yellow-500', symbol: '🍋' },
  { name: 'Watermelon', color: 'bg-green-500', symbol: '🍉' },
  { name: 'Grape', color: 'bg-purple-500', symbol: '🍇' },
  { name: 'Orange', color: 'bg-orange-500', symbol: '🍊' },
] as const;

type Fruit = typeof fruits[number];

const getRandomFruit = (): Fruit => fruits[Math.floor(Math.random() * fruits.length)];

const FruitIcon = ({ fruit }: { fruit: Fruit }) => (
  <div className={`w-16 h-16 rounded-full ${fruit.color} flex items-center justify-center text-4xl`}>
    {fruit.symbol}
  </div>
);

export default function EnhancedSlotMachine() {
  const [reels, setReels] = useState<Fruit[]>([getRandomFruit(), getRandomFruit(), getRandomFruit()]);
  const [spinning, setSpinning] = useState(false);
  const [balance, setBalance] = useState(100);
  const [betAmount, setBetAmount] = useState(1);
  const [addAmount, setAddAmount] = useState('');

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => console.log('Connected to WebSocket server');
    ws.onclose = () => console.log('Disconnected from WebSocket server');

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'spin') {
        spin();
      } else if (message.type === 'addBalance') {
        setBalance((prevBalance) => prevBalance + (message.amount || 0));
        toast.success(`Added ${message.amount} coins to your balance`);
      }
    };

    return () => ws.close();
  }, []);

  const spin = () => {
    if (balance < betAmount) {
      toast.error("Insufficient balance!");
      return;
    }

    setSpinning(true);
    setBalance((prevBalance) => prevBalance - betAmount);

    const spinDuration = 2000;
    const intervalDuration = 100;
    let spins = 0;

    const spinInterval = setInterval(() => {
      setReels([getRandomFruit(), getRandomFruit(), getRandomFruit()]);
      spins++;

      if (spins * intervalDuration >= spinDuration) {
        clearInterval(spinInterval);
        setSpinning(false);
        checkWin();
      }
    }, intervalDuration);
  };

  const checkWin = () => {
    if (reels[0].name === reels[1].name && reels[1].name === reels[2].name) {
      const winAmount = betAmount * 10;
      setBalance((prevBalance) => prevBalance + winAmount);
      toast.success(`You won ${winAmount} coins!`);
    }
  };

  const addMoney = () => {
    const amount = parseInt(addAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setBalance((prevBalance) => prevBalance + amount);
    setAddAmount('');
    toast.success(`Added ${amount} coins to your balance`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-600 to-blue-600 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Fruit Slot Machine</h1>

        <div className="mb-6 p-4 bg-gray-800 rounded-lg shadow-inner">
          <div className="flex justify-center space-x-2 mb-4">
            {reels.map((fruit, index) => (
              <motion.div
                key={index}
                className="w-24 h-24 bg-gray-700 rounded-lg flex items-center justify-center"
                animate={spinning ? { y: [0, -20, 0], transition: { duration: 0.5, repeat: Infinity } } : {}}
              >
                <FruitIcon fruit={fruit} />
              </motion.div>
            ))}
          </div>
          <div className="flex justify-center">
            <div className="w-16 h-4 bg-yellow-500 rounded-t-full"></div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold">Balance: {balance} coins</span>
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              placeholder="Amount"
              className="w-24"
            />
            <Button onClick={addMoney} variant="outline">Add Money</Button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold">Bet: {betAmount} coins</span>
          <div className="flex items-center space-x-2">
            <Button onClick={() => setBetAmount(Math.max(1, betAmount - 1))} variant="outline">-</Button>
            <Button onClick={() => setBetAmount(betAmount + 1)} variant="outline">+</Button>
          </div>
        </div>

        <Button
          onClick={spin}
          disabled={spinning || balance < betAmount}
          className="w-full py-2 px-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-lg shadow-md hover:from-pink-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 transition-all duration-300"
        >
          {spinning ? 'Spinning...' : 'Spin!'}
        </Button>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}
