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

const Home: NextPage = () => {
  return (
    <main className="h-screen w-screen overflow-hiddenbun">
      <MapBox />
      <CreateLandModal />
      <Status />

      <DateSelect />
      <div className="fixed top-8 left-8 flex flex-col gap-6 w-80">
        <div className="flex flex-col gap-3">
          <DisplayField />
          <ViewModeSwitch />
        </div>
        <FieldsList />
      </div>
      <div className="fixed top-8 right-8 flex flex-col gap-6 w-80">
        <StatsDisplay />
      </div>
    </main>
  );
};

export default Home;
