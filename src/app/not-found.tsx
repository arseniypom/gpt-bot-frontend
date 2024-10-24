export default function NotFound() {
  return (
    <main className="h-screen w-screen flex items-center justify-center p-4">
      <div className="text-center flex items-center w-full max-w-64 h-56 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 p-4">
        <div role="status">The page you are looking for does not exist 😟</div>
      </div>
    </main>
  );
}
