import { useParams } from "react-router-dom";

export default function ResourceDetail() {
  const { id } = useParams();
  return <div style={{ padding: 24 }}>Resource: {id}</div>;
}
