import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { TopBar } from "../components/UI";
import BottomNav from "../components/BottomNav";

const DAYS = [
  "Aujourd’hui",
  "Demain",
  "Dans 2 jours",
  "Dans 3 jours",
  "Dans 4 jours",
  "Dans 5 jours",
  "Dans 6 jours",
];

const TIMES = ["Matin", "Midi", "Après-midi", "Soir"];

export default function AvailabilityPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggle = (slot) => {
    setSelected((prev) =>
      prev.includes(slot)
        ? prev.filter((s) => s !== slot)
        : [...prev, slot]
    );
  };

  const submit = async () => {
    if (selected.length === 0) {
      alert("Choisis au moins un créneau");
      return;
    }

    setLoading(true);

    try {
      await updateDoc(doc(db, "exchanges", id), {
        availabilityStatus: "pending",
        availabilityProposals: selected,
        updatedAt: serverTimestamp(),
      });

      navigate(`/exchanges/${id}`);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l’envoi des disponibilités.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page max-w-lg mx-auto">
      <TopBar title="Disponibilités" back={() => navigate(-1)} />

      <div className="px-5 py-5 space-y-5">
        <h2 className="text-xl font-black text-slate-900">
          Quand es-tu disponible ?
        </h2>

        {DAYS.map((day) => (
          <div key={day} className="bg-white rounded-2xl p-4 border">
            <p className="font-bold mb-2">{day}</p>

            <div className="flex gap-2 flex-wrap">
              {TIMES.map((time) => {
                const slot = `${day} - ${time}`;
                const active = selected.includes(slot);

                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggle(slot)}
                    className={`px-3 py-2 rounded-full text-sm font-bold ${
                      active ? "bg-troco-green text-white" : "bg-gray-100"
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <button
          onClick={submit}
          className="btn-primary w-full"
          disabled={loading}
        >
          {loading ? "Envoi..." : "Envoyer mes disponibilités"}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}