import logo from "../assets/icons/logo.svg";
import time from "../assets/icons/time.svg";
import words from "../assets/icons/words.svg";
import restart from "../assets/icons/restart.svg";
import next from "../assets/icons/next.svg";

const icons = { logo, time, words, restart, next };
export type IconName = keyof typeof icons;

export const Icon = ({ name }: { name: IconName }) => (
  <span
    aria-hidden='true'
    className={`icon icon--${name}`}
    style={{ maskImage: `url("${icons[name]}")` }}
  />
);
