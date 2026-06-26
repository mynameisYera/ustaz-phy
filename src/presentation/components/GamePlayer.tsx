interface Props {
  launchUrl: string | null;
}

export function GamePlayer({ launchUrl }: Props) {
  if (!launchUrl) {
    return (
      <div className="player placeholder">
        <p>Ойын алаңы</p>
      </div>
    );
  }

  return (
    <div className="player">
      <iframe
        title="Интерактивті ойын"
        src={launchUrl}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
