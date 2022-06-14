import './style.css';
import { convert, codeToString } from 'encoding-japanese';

document.querySelector('form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const log = document.querySelector<HTMLInputElement>('input');
  const files = log?.files;
  if (!files) {
    return;
  }

  const text = await readFile(files[0]);
  const records = parseText(text);
  const output = convertToCsv(records);
  download('log.csv', output);
});

const convertToCsv = (records: LogRecord[]): string => {
  const outputs = records.map((r) => {
    return `${r.handle},${r.layer},${r.bottom_x},${r.bottom_y},${r.bottom_z},${r.top_x},${r.top_y},${r.top_z}`;
  });

  const header =
    'Handle,Layer,Boundary_Bottom_X,Boundary_Bottom_Y,Boundary_Bottom_Z,Boundary_Top_X,Boundary_Top_Y,Boundary_Top_Z';

  return [header, ...outputs].join('\n');
};

function download(file_name: string, data: string) {
  const blob = new Blob([data], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.download = file_name;
  a.href = url;
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const parseText = (text: string) => {
  const handles: string[] = [];
  const layers: string[] = [];
  const bottoms: Point[] = [];
  const tops: Point[] = [];

  const records: LogRecord[] = [];

  const lines = text.split('\r\n');

  for (const line of lines) {
    // ハンドル
    let regexp = /ハンドル\s+=\s+(\w+)/g;
    const handle = regexp.exec(line)?.at(-1);
    if (handle) {
      handles.push(handle);
    }

    // 画層
    regexp = /3DSOLID   画層:\s+\"(.+)\"$/g;
    const layer = regexp.exec(line)?.at(-1);
    if (layer) {
      layers.push(layer);
    }

    // 境界下部
    regexp = /境界下部 X\s+=\s+(.+)、Y\s+=\s+(.+)、Z\s+=\s+(.+)$/g;

    let matches = regexp.exec(line);
    if (matches) {
      const x = matches.at(-3)?.trim();
      const y = matches.at(-2)?.trim();
      const z = matches.at(-1)?.trim();
      bottoms.push({ x: Number(x), y: Number(y), z: Number(z) });
    }

    // 境界上部
    regexp = /境界上部 X = (.+)、Y = (.+)、Z = (.+)$/g;
    matches = regexp.exec(line);
    if (matches) {
      const x = matches.at(-3)?.trim();
      const y = matches.at(-2)?.trim();
      const z = matches.at(-1)?.trim();
      tops.push({ x: Number(x), y: Number(y), z: Number(z) });
    }
  }

  for (let i = 0; i < handles.length; i++) {
    const handle = handles[i];
    const top = tops[i];
    const bottom = bottoms[i];
    const layer = layers[i];
    const record: LogRecord = {
      handle,
      layer,
      top_x: top.x,
      top_y: top.y,
      top_z: top.z,
      bottom_x: bottom.x,
      bottom_y: bottom.y,
      bottom_z: bottom.z,
    };
    records.push(record);
  }

  return records;
};

type LogRecord = {
  handle: string;
  layer: string;
  bottom_x: number;
  bottom_y: number;
  bottom_z: number;
  top_x: number;
  top_y: number;
  top_z: number;
};

type Point = {
  x: number;
  y: number;
  z: number;
};

const readFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;

      const unicodeArray = convert(new Uint8Array(buffer), {
        from: 'SJIS',
        to: 'UNICODE',
      });

      const text = codeToString(unicodeArray);
      resolve(text);
    };

    reader.onerror = () => {
      reject(new Error('error occurred'));
    };

    reader.readAsArrayBuffer(file);
  });
};
