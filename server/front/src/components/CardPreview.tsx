type CardPreviewProps = {
  imageBase64: string;
};

export default function CardPreview({ imageBase64 }: CardPreviewProps) {
  return (
    <div className="card-preview">
      <img src={`data:image/png;base64,${imageBase64}`} alt="card preview" />
    </div>
  );
}
