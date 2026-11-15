import { Field, FieldHeader } from "./client";
import { fields } from "~/db/schema";
import { db } from "~/db";
import { Land } from "~/lib/store/land-store";

export const FieldsList = async () => {
  const result = await db.select().from(fields);

  return (
    <div className="flex flex-col p-2 gap-2 bg-paper border border-line shadow-lg rounded-2xl min-h-0 overflow-y-auto">
      <FieldHeader />
      {result.map((field) => (
        <Field
          key={field.id}
          {...field}
          polygonId={field.polygonId!}
          coordinates={field.coordinates as Land["coordinates"]}
        />
      ))}
      {!result.length && (
        <p className="text-mute px-2 pb-2 leading-5">
          No fields yet. Press “Add field” and draw your field on the map.
        </p>
      )}
    </div>
  );
};
