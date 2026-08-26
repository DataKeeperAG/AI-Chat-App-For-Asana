export default function EmptyState() {
  return (
    <section
  className="
    flex flex-1 flex-col items-center justify-center text-center
    bg-[repeating-linear-gradient(140deg,rgba(239,246,255,0.6)_0px,rgba(239,246,255,0.7)_14px,rgba(219,234,254,0.6)_14px,rgba(219,234,254,0.7)_28px)]
  "
>
  <h2 className="text-2xl font-semibold">How may I help?</h2>

  <p className="mt-2 max-w-md text-gray-500">
    Enter a message below to start a conversation.
  </p>
  <span className="inline-block text-9xl text-red-500 leading-none">↓</span>
  <span className="inline-block text-9xl text-orange-500 leading-none">↓</span>
  <span className="inline-block text-9xl text-yellow-500 leading-none">↓</span>
  <span className="inline-block text-9xl text-green-500 leading-none">↓</span>
</section>
  );
}