import type { NextPage } from "next";
import { CreateLandModal } from "~/features/fields/create-field";
import { DisplayField } from "~/features/fields/display-field";
import { FieldsList } from "~/features/fields/fields-list";
import DateSelect from "~/features/preferences/date-select";
import { ViewModeSwitch } from "~/features/preferences/view-mode-switch";
import "./globals.css";
import MapBox from "~/features/map";
import { Status } from "~/features/status";
import StatsDisplay from "~/features/meta/stats-display";
import { DrawHint } from "~/features/fields/draw-hint";

const Home: NextPage = () => {
  return (
    <main className="h-screen w-screen overflow-hidden">
      <MapBox />
      <CreateLandModal />
      <Status />
      <DrawHint />

      <DateSelect />
      <div className="fixed top-6 left-6 flex flex-col gap-3 w-80 max-h-[calc(100vh-3rem)]">
        <DisplayField />
        <FieldsList />
        <ViewModeSwitch />
      </div>
      <div className="fixed top-6 right-6 w-80 max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl">
        <StatsDisplay />
      </div>
    </main>
  );
};

export default Home;
