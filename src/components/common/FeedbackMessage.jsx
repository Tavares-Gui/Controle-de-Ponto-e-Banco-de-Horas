export default function FeedbackMessage({ feedback }) {
  if (!feedback) return null
  return <p className={`msg ${feedback.type}`}>{feedback.message}</p>
}
