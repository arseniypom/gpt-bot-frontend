import Image from 'next/image';

export default function Page() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="max-w-[25rem]">
        <div className="overflow-hidden bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 flex justify-center w-full relative h-60 sm:h-72">
          <Image className="object-cover" src="/bot-pic.jpg" alt="" fill />
        </div>
        <div className="mt-3 p-1">
          <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Ваш платеж был обработан&nbsp;✅
          </h5>
          <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
            Теперь можете закрыть эту страницу и&nbsp;вернуться к&nbsp;боту для
            проверки баланса.
          </p>
        </div>
      </div>
    </div>
  );
}
