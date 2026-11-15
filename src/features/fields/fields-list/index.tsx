import { Field, FieldHeader } from "./client";
import { fields } from "~/db/schema";
import { db } from "~/db";
import { Land } from "~/lib/store/land-store";

export const FieldsList = async () => {
  const result = await db.select().from(fields);

  return (
    <div className="flex flex-col p-2 gap-2 bg-neutral-900/80 backdrop-blur-md rounded-xl">
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
        <p className="text-neutral-500 px-1">No created fields yet</p>
      )}
    </div>
  );
};
