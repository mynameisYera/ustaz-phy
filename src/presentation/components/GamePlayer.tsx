interface Props {
  launchUrl: string | null;
}

export function GamePlayer({ launchUrl }: Props) {
  if (!launchUrl) {
    return (
      <div className="player placeholder">
        <p>Создайте игру — она появится здесь</p>
      </div>
    );
  }

  return (
    <div className="player">
      <iframe
        title="Интерактивная игра"
        src={launchUrl}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
