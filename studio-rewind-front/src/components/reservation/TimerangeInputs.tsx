// TimeRangeInputs.tsx
type TimeRangeInputsProps = {
  startTime: string;
  endTime: string;
  onChangeStart: (value: string) => void;
  onChangeEnd: (value: string) => void;
  disabledStartTimes?: string[]; // ex: ["10:00", "11:00"]
  disabledEndTimes?: string[];   // ex: ["13:00"]
  hideEndTime?: boolean;         // pour formule Réseaux (durée fixe)
  fixedDurationLabel?: string;   // ex: "Durée fixe : 2h"
};

const TimeRangeInputs = ({
  startTime,
  endTime,
  onChangeStart,
  onChangeEnd,
  disabledStartTimes = [],
  disabledEndTimes = [],
  hideEndTime = false,
  fixedDurationLabel,
}: TimeRangeInputsProps) => {
  // heures de 09:00 à 18:00
  const hours: string[] = [];
  for (let h = 9; h <= 18; h++) {
    hours.push(`${h.toString().padStart(2, '0')}:00`);
  }

  // heures de fin filtrées (uniquement > startTime)
  const filteredEndHours = startTime
    ? hours.filter((hour) => {
        const [sh] = startTime.split(':').map(Number);
        const [eh] = hour.split(':').map(Number);
        return eh > sh; // heure de fin strictement supérieure
      })
    : hours;

  // si l'heure de fin choisie n'est plus valide → reset
  if (endTime && !filteredEndHours.includes(endTime)) {
    onChangeEnd('');
  }
  // si l'heure de fin est dans les disabled → reset
  if (endTime && disabledEndTimes.includes(endTime)) {
    onChangeEnd('');
  }

  return (
    <div className="booked-time-inputs">
      <div className="booked-time-field">
        <label htmlFor="startTime">Heure de début</label>
        <select
          id="startTime"
          value={startTime}
          onChange={(e) => {
            onChangeStart(e.target.value);
            onChangeEnd(''); // reset fin quand on change le début
          }}
        >
          <option value="">Sélectionner</option>
          {hours.map((hour) => (
            <option
              key={hour}
              value={hour}
              disabled={disabledStartTimes.includes(hour)}
            >
              {hour}
            </option>
          ))}
        </select>
      </div>

      {hideEndTime ? (
        <div className="booked-time-field">
          <label>{fixedDurationLabel || 'Durée fixe'}</label>
          <p className="fixed-duration-display">
            {startTime ? `${startTime} → ${endTime}` : '—'}
          </p>
        </div>
      ) : (
        <div className="booked-time-field">
          <label htmlFor="endTime">Heure de fin</label>
          <select
            id="endTime"
            value={endTime}
            onChange={(e) => onChangeEnd(e.target.value)}
            disabled={!startTime}
          >
            <option value="">Sélectionner</option>
            {filteredEndHours.map((hour) => (
              <option
                key={hour}
                value={hour}
                disabled={disabledEndTimes.includes(hour)}
              >
                {hour}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default TimeRangeInputs;
