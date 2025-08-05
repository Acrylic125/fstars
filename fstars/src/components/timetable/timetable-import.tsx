"use client";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import {
  Dropzone,
  DropzoneEmptyState,
  renderBytes,
  useDropzoneContext,
} from "@/components/ui/dropzone";
import { useCallback, useMemo, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  UploadIcon,
} from "lucide-react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { ExportTimetableFileSchema } from "./timetable-export-utils";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import superjson from "superjson";
import { Timetable, TimetableId, useTimetableStore } from "./timetable-store";
import {
  TimetableGenerator,
  TimetableGeneratorId,
  useTimetableGeneratorStore,
} from "./timetable-generator-store";
import { cn, deepCompare } from "@/lib/utils";
import { ScrollArea } from "../ui/scroll-area";
import { Checkbox } from "../ui/checkbox";
import { useShallow } from "zustand/react/shallow";

export function DropzoneContent() {
  const { src } = useDropzoneContext();

  if (src && src.length > 0) {
    const file = src[0];
    return (
      <div className="flex flex-row gap-4 items-center p-4 h-fit justify-start w-full text-left">
        <UploadIcon className="size-4" />
        <div className="flex flex-col gap-1 justify-center items-start">
          <h3 className="text-sm font-medium">
            {file.name}{" "}
            <span className="text-muted-foreground">
              {renderBytes(file.size)}
            </span>
          </h3>
          <p className="w-full text-xs text-muted-foreground">
            Select an exported timetable file to replace.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 items-center p-4 h-28">
      <UploadIcon className="size-4" />
      <div className="flex flex-col gap-1 items-center">
        <h3 className="text-sm font-medium">Import Timetable</h3>
        <p className="text-xs text-muted-foreground">
          Select an exported timetable file to import.
        </p>
      </div>
    </div>
  );
}

export function TimetableImportFile({
  onDrop,
}: {
  onDrop: (files: File[]) => void;
}) {
  const [files, setFiles] = useState<File[] | undefined>();
  const handleDrop = (files: File[]) => {
    onDrop(files);
    setFiles(files);
  };
  return (
    <Dropzone
      accept={{ "application/json": [] }}
      maxFiles={1}
      maxSize={1024 * 1024} // 1MB
      minSize={1024} // 1KB
      onDrop={handleDrop}
      onError={console.error}
      src={files}
      className="h-fit p-0"
    >
      <DropzoneContent />
    </Dropzone>
  );
}

export function ImportRow({
  id,
  name,
  type,
  imported,
  checked,
  onCheckedChange,
}: {
  id: string;
  name: string;
  type: "add" | "update" | "unchanged";
  imported?: boolean;
  checked?: boolean;
  onCheckedChange?: (id: string, checked: boolean) => void;
}) {
  const handleCheckedChange = useCallback(
    (checked: boolean) => {
      console.log("checked", checked);
      onCheckedChange?.(id, checked);
    },
    [id, onCheckedChange]
  );
  return (
    <div
      className={cn("flex flex-row py-2 gap-2 px-2", {
        "bg-green-50 dark:bg-green-700/25": type === "add",
        "bg-yellow-50 dark:bg-yellow-700/25": type === "update",
        // "bg-green-700": type === "add",
        // "bg-yellow-700": type === "update",
      })}
    >
      <div className="flex flex-row items-center">
        {imported ? (
          <CheckIcon className="size-4" />
        ) : (
          <Checkbox
            disabled={type === "unchanged"}
            onCheckedChange={handleCheckedChange}
            checked={checked}
            className={cn({
              "bg-green-100 dark:bg-green-950 border-green-500 dark:border-green-600":
                type === "add",
              "bg-yellow-100 dark:bg-yellow-950 border-yellow-500 dark:border-yellow-600":
                type === "update",
            })}
          />
        )}
      </div>
      <div className="flex flex-row items-center truncate w-full">
        <p
          className={cn("text-sm font-medium", {
            "text-muted-foreground": type === "unchanged",
          })}
        >
          {name}
        </p>
      </div>
      <div className="flex flex-row items-center">
        {type === "unchanged" && (
          <div className="text-xs text-muted-foreground">Unchanged</div>
        )}
        {type === "add" && (
          <div className="text-xs bg-green-200 text-green-900 dark:bg-green-300/20 dark:text-green-300 px-2 py-0.5 rounded-sm">
            New
          </div>
        )}
        {type === "update" && (
          <div className="text-xs bg-yellow-100 text-yellow-900 dark:bg-yellow-300/20 dark:text-yellow-300 px-2 py-0.5 rounded-sm">
            Update
          </div>
        )}
      </div>
    </div>
  );
}

type ImportResponse = {
  timetables: {
    toAdd: Timetable[];
    toUpdate: Timetable[];
    withNoChanges: Timetable[];
  };
  generators: {
    toAdd: TimetableGenerator[];
    toUpdate: TimetableGenerator[];
    withNoChanges: TimetableGenerator[];
  };
};

export function TimetableImportModalPage({
  importMutation,
  previousPage,
  nextPage,
}: {
  importMutation: UseMutationResult<ImportResponse, Error, File[]>;
  previousPage?: () => void;
  nextPage?: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 px-6">
      <DialogHeader className="px-2">
        <DialogTitle>Select a file to import</DialogTitle>
      </DialogHeader>

      <DialogDescription className="sr-only">
        Select a file to import
      </DialogDescription>

      <TimetableImportFile onDrop={importMutation.mutate} />
      {importMutation.isPending && (
        <div className="w-full flex flex-col">
          <Alert variant="info">
            <AlertTitle>Importing...</AlertTitle>
          </Alert>
        </div>
      )}
      {importMutation.error && (
        <div className="w-full flex flex-col">
          <Alert variant="error">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{importMutation.error.message}</AlertDescription>
          </Alert>
        </div>
      )}

      <DialogFooter className="flex flex-row justify-between sm:justify-between gap-2">
        <div className="flex flex-row gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </div>
        <div className="flex flex-row gap-2">
          <Button
            variant="ghost"
            disabled={!previousPage}
            onClick={previousPage}
          >
            <ArrowLeftIcon /> Back
          </Button>
          <Button
            variant="ghost"
            disabled={!nextPage || !importMutation.data}
            onClick={nextPage}
          >
            Next <ArrowRightIcon />
          </Button>
        </div>
      </DialogFooter>
    </div>
  );
}

export function TimetableImportModalTimetablePage({
  importMutation,
  previousPage,
  nextPage,
  selectedTimetables,
  setSelectedTimetables,
  importedTimetables,
  setImportedTimetables,
}: {
  importMutation: UseMutationResult<ImportResponse, Error, File[]>;
  previousPage?: () => void;
  nextPage?: () => void;
  selectedTimetables: Set<TimetableId>;
  setSelectedTimetables: (
    timetables:
      | Set<TimetableId>
      | ((timetables: Set<TimetableId>) => Set<TimetableId>)
  ) => void;
  importedTimetables: Set<TimetableId>;
  setImportedTimetables: (
    timetables:
      | Set<TimetableId>
      | ((timetables: Set<TimetableId>) => Set<TimetableId>)
  ) => void;
}) {
  const handleCheckedChange = useCallback(
    (id: TimetableId, checked: boolean) => {
      setSelectedTimetables((timetables) => {
        if (checked) {
          timetables.add(id);
        } else {
          timetables.delete(id);
        }
        return new Set(timetables);
      });
    },
    [setSelectedTimetables]
  );
  const timetableStore = useTimetableStore(
    useShallow((state) => {
      return {
        importTimetables: state.importTimetables,
      };
    })
  );

  const hasValidSelected = useMemo(() => {
    if (selectedTimetables.size === 0) {
      return false;
    }
    for (const timetableId of selectedTimetables) {
      if (importedTimetables.has(timetableId)) {
        continue;
      }
      return true;
    }
    return false;
  }, [selectedTimetables, importedTimetables]);

  const importTimetablesMutation = useMutation({
    mutationFn: async () => {
      if (!hasValidSelected) {
        return;
      }
      const data = importMutation.data;
      if (!data) {
        return;
      }
      const allTimetables = [
        ...data.timetables.toAdd,
        ...data.timetables.toUpdate,
        ...data.timetables.withNoChanges,
      ];
      const toImportTimetables: Timetable[] = [];
      for (const timetable of allTimetables) {
        // Skip imported.
        if (importedTimetables.has(timetable.id)) {
          continue;
        }
        if (selectedTimetables.has(timetable.id)) {
          toImportTimetables.push(timetable);
        }
      }
      if (toImportTimetables.length === 0) {
        return;
      }
      const res = timetableStore.importTimetables(toImportTimetables);
      if (res.type === "error") {
        throw new Error(res.error);
      }
      return selectedTimetables;
    },
    onSuccess: (selectedTimetables) => {
      if (!selectedTimetables) {
        return;
      }
      setSelectedTimetables(new Set());
      setImportedTimetables((prev) => {
        for (const timetableId of selectedTimetables) {
          prev.add(timetableId);
        }
        return new Set(prev);
      });
    },
  });

  return (
    <div className="flex flex-col gap-4 px-4">
      <DialogHeader className="px-2">
        <DialogTitle>Select Timetables to Import</DialogTitle>
      </DialogHeader>

      <DialogDescription className="sr-only">
        Select timetables to import
      </DialogDescription>

      {importMutation.isSuccess && importMutation.data && (
        <div className="w-full flex flex-col gap-2">
          <h3 className="text-sm font-medium px-2">Timetables</h3>
          <ScrollArea className="flex flex-col max-h-48">
            <div className="flex flex-col">
              {importMutation.data.timetables.toAdd.map((timetable) => (
                <ImportRow
                  key={timetable.id}
                  id={timetable.id}
                  name={timetable.name}
                  type="add"
                  imported={importedTimetables.has(timetable.id)}
                  onCheckedChange={handleCheckedChange}
                  checked={selectedTimetables.has(timetable.id)}
                />
              ))}
              {importMutation.data.timetables.toUpdate.map((timetable) => (
                <ImportRow
                  key={timetable.id}
                  id={timetable.id}
                  name={timetable.name}
                  type="update"
                  imported={importedTimetables.has(timetable.id)}
                  onCheckedChange={handleCheckedChange}
                  checked={selectedTimetables.has(timetable.id)}
                />
              ))}
              {importMutation.data.timetables.withNoChanges.map((timetable) => (
                <ImportRow
                  key={timetable.id}
                  id={timetable.id}
                  name={timetable.name}
                  type="unchanged"
                  imported={importedTimetables.has(timetable.id)}
                  onCheckedChange={handleCheckedChange}
                  checked={selectedTimetables.has(timetable.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {importTimetablesMutation.isError && importTimetablesMutation.error && (
        <div className="w-full flex flex-col px-2">
          <Alert variant="error">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {importTimetablesMutation.error.message}
            </AlertDescription>
          </Alert>
        </div>
      )}
      {importTimetablesMutation.isSuccess && importTimetablesMutation.data && (
        <div className="w-full flex flex-col px-2">
          <Alert variant="success">
            <AlertTitle>Imported</AlertTitle>
            <AlertDescription>
              {importTimetablesMutation.data.size} timetables imported.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <DialogFooter className="flex flex-row justify-between sm:justify-between gap-2 px-2">
        <div className="flex flex-row gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant="default"
            onClick={() => importTimetablesMutation.mutate()}
            disabled={importTimetablesMutation.isPending || !hasValidSelected}
          >
            Import
          </Button>
        </div>
        <div className="flex flex-row gap-2">
          <Button
            variant="ghost"
            disabled={!previousPage}
            onClick={previousPage}
          >
            <ArrowLeftIcon /> Back
          </Button>
          <Button
            variant="ghost"
            disabled={!nextPage && importMutation.isSuccess}
            onClick={nextPage}
          >
            Next <ArrowRightIcon />
          </Button>
        </div>
      </DialogFooter>
    </div>
  );
}

export function TimetableImportModalGeneratorPage({
  importMutation,
  previousPage,
  selectedGenerators,
  setSelectedGenerators,
  importedGenerators,
  setImportedGenerators,
}: {
  importMutation: UseMutationResult<ImportResponse, Error, File[]>;
  previousPage?: () => void;
  selectedGenerators: Set<TimetableGeneratorId>;
  setSelectedGenerators: (
    generators:
      | Set<TimetableGeneratorId>
      | ((generators: Set<TimetableGeneratorId>) => Set<TimetableGeneratorId>)
  ) => void;
  importedGenerators: Set<TimetableGeneratorId>;
  setImportedGenerators: (
    generators:
      | Set<TimetableGeneratorId>
      | ((generators: Set<TimetableGeneratorId>) => Set<TimetableGeneratorId>)
  ) => void;
}) {
  const handleCheckedChange = useCallback(
    (id: TimetableGeneratorId, checked: boolean) => {
      setSelectedGenerators((generators) => {
        if (checked) {
          generators.add(id);
        } else {
          generators.delete(id);
        }
        return new Set(generators);
      });
    },
    [setSelectedGenerators]
  );
  const generatorStore = useTimetableGeneratorStore(
    useShallow((state) => {
      return {
        importGenerators: state.importGenerators,
      };
    })
  );

  const hasValidSelected = useMemo(() => {
    if (selectedGenerators.size === 0) {
      return false;
    }
    for (const generatorId of selectedGenerators) {
      if (importedGenerators.has(generatorId)) {
        continue;
      }
      return true;
    }
    return false;
  }, [selectedGenerators, importedGenerators]);

  const importGeneratorsMutation = useMutation({
    mutationFn: async () => {
      if (!hasValidSelected) {
        return;
      }
      const data = importMutation.data;
      if (!data) {
        return;
      }
      const allGenerators = [
        ...data.generators.toAdd,
        ...data.generators.toUpdate,
        ...data.generators.withNoChanges,
      ];
      const toImportGenerators: TimetableGenerator[] = [];
      for (const generator of allGenerators) {
        // Skip imported.
        if (importedGenerators.has(generator.id)) {
          continue;
        }
        if (selectedGenerators.has(generator.id)) {
          toImportGenerators.push(generator);
        }
      }
      if (toImportGenerators.length === 0) {
        return;
      }
      const res = generatorStore.importGenerators(toImportGenerators);
      if (res.type === "error") {
        throw new Error(res.error);
      }
      return selectedGenerators;
    },
    onSuccess: (selectedGenerators) => {
      if (!selectedGenerators) {
        return;
      }
      setSelectedGenerators(new Set());
      setImportedGenerators((prev) => {
        for (const generatorId of selectedGenerators) {
          prev.add(generatorId);
        }
        return new Set(prev);
      });
    },
  });

  return (
    <div className="flex flex-col gap-4 px-4">
      <DialogHeader className="px-2">
        <DialogTitle>Select Generators to Import</DialogTitle>
      </DialogHeader>

      <DialogDescription className="sr-only">
        Select generators to import
      </DialogDescription>

      {importMutation.isSuccess && importMutation.data && (
        <div className="w-full flex flex-col gap-2">
          <h3 className="text-sm font-medium px-2">Generators</h3>
          <ScrollArea className="flex flex-col max-h-48">
            <div className="flex flex-col">
              {importMutation.data.generators.toAdd.map((generator) => (
                <ImportRow
                  key={generator.id}
                  id={generator.id}
                  name={generator.name}
                  type="add"
                  imported={importedGenerators.has(generator.id)}
                  onCheckedChange={handleCheckedChange}
                  checked={selectedGenerators.has(generator.id)}
                />
              ))}
              {importMutation.data.generators.toUpdate.map((generator) => (
                <ImportRow
                  key={generator.id}
                  id={generator.id}
                  name={generator.name}
                  type="update"
                  imported={importedGenerators.has(generator.id)}
                  onCheckedChange={handleCheckedChange}
                  checked={selectedGenerators.has(generator.id)}
                />
              ))}
              {importMutation.data.generators.withNoChanges.map((generator) => (
                <ImportRow
                  key={generator.id}
                  id={generator.id}
                  name={generator.name}
                  type="unchanged"
                  imported={importedGenerators.has(generator.id)}
                  onCheckedChange={handleCheckedChange}
                  checked={selectedGenerators.has(generator.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {importGeneratorsMutation.isError && importGeneratorsMutation.error && (
        <div className="w-full flex flex-col px-2">
          <Alert variant="error">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {importGeneratorsMutation.error.message}
            </AlertDescription>
          </Alert>
        </div>
      )}
      {importGeneratorsMutation.isSuccess && importGeneratorsMutation.data && (
        <div className="w-full flex flex-col px-2">
          <Alert variant="success">
            <AlertTitle>Imported</AlertTitle>
            <AlertDescription>
              {importGeneratorsMutation.data.size} timetables imported.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <DialogFooter className="flex flex-row justify-between sm:justify-between gap-2 px-2">
        <div className="flex flex-row gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant="default"
            onClick={() => importGeneratorsMutation.mutate()}
            disabled={importGeneratorsMutation.isPending || !hasValidSelected}
          >
            Import
          </Button>
        </div>
        <div className="flex flex-row gap-2">
          <Button
            variant="ghost"
            disabled={!previousPage}
            onClick={previousPage}
          >
            <ArrowLeftIcon /> Back
          </Button>
          <DialogClose asChild>
            <Button variant="default" disabled={!importMutation.isSuccess}>
              Done <ArrowRightIcon />
            </Button>
          </DialogClose>
        </div>
      </DialogFooter>
    </div>
  );
}

export function TimetableImportModal() {
  const [page, setPage] = useState<
    "import-from-file" | "import-timetables" | "import-generators"
  >("import-from-file");

  const [selectedTimetables, setSelectedTimetables] = useState<
    Set<TimetableId>
  >(new Set());
  const [importedTimetables, setImportedTimetables] = useState<
    Set<TimetableId>
  >(new Set());

  const [selectedGenerators, setSelectedGenerators] = useState<
    Set<TimetableGeneratorId>
  >(new Set());
  const [importedGenerators, setImportedGenerators] = useState<
    Set<TimetableGeneratorId>
  >(new Set());

  const importMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const file = files[0];
      const fileContent = await file.text();
      const json = superjson.parse(fileContent);
      const parsed = ExportTimetableFileSchema.parse(json);

      const currentTimetables = useTimetableStore.getState().timetables;

      const timetables = {
        toAdd: [] as Timetable[],
        toUpdate: [] as Timetable[],
        withNoChanges: [] as Timetable[],
      };
      for (const timetable of parsed.timetables.values()) {
        const cur = currentTimetables.get(timetable.id);
        if (!cur) {
          timetables.toAdd.push(timetable);
          continue;
        }
        if (deepCompare(cur, timetable)) {
          timetables.withNoChanges.push(timetable);
          continue;
        }
        timetables.toUpdate.push(timetable);
      }

      const currentGenerators =
        useTimetableGeneratorStore.getState().generators;
      const generators = {
        toAdd: [] as TimetableGenerator[],
        toUpdate: [] as TimetableGenerator[],
        withNoChanges: [] as TimetableGenerator[],
      };
      for (const generator of parsed.generators.values()) {
        const cur = currentGenerators.get(generator.id);
        if (!cur) {
          generators.toAdd.push(generator);
          continue;
        }
        if (deepCompare(cur, generator)) {
          generators.withNoChanges.push(generator);
          continue;
        }
        generators.toUpdate.push(generator);
      }

      return {
        timetables,
        generators,
      };
    },
    onSuccess: (data) => {
      setSelectedTimetables(new Set(data.timetables.toAdd.map((t) => t.id)));
      setImportedTimetables(new Set());
      setSelectedGenerators(new Set(data.generators.toAdd.map((g) => g.id)));
      setImportedGenerators(new Set());
    },
  });

  let ele = null;

  if (page === "import-from-file") {
    ele = (
      <TimetableImportModalPage
        importMutation={importMutation}
        nextPage={() => setPage("import-timetables")}
      />
    );
  }

  if (page === "import-timetables") {
    ele = (
      <TimetableImportModalTimetablePage
        importMutation={importMutation}
        nextPage={() => setPage("import-generators")}
        previousPage={() => setPage("import-from-file")}
        selectedTimetables={selectedTimetables}
        setSelectedTimetables={setSelectedTimetables}
        importedTimetables={importedTimetables}
        setImportedTimetables={setImportedTimetables}
      />
    );
  }

  if (page === "import-generators") {
    ele = (
      <TimetableImportModalGeneratorPage
        importMutation={importMutation}
        previousPage={() => setPage("import-timetables")}
        selectedGenerators={selectedGenerators}
        setSelectedGenerators={setSelectedGenerators}
        importedGenerators={importedGenerators}
        setImportedGenerators={setImportedGenerators}
      />
    );
  }
  return (
    <DialogContent className="max-w-2xl sm:max-w-2xl px-0">{ele}</DialogContent>
  );
}
