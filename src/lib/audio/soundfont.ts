import Tone from 'tone';
import { ContextTime, Seconds } from '@/lib/audio/types';
import { Source } from '@/lib/audio/source';
import { context } from '@/lib/audio/context';
import { sendRequest, parseNote, base64Decode } from '@/lib/mutils';
import decode from 'audio-decode';
import ADSR from 'envelope-generator';

export type SoundfontName =
  | 'accordion'
  | 'acoustic_bass'
  | 'acoustic_grand_piano'
  | 'acoustic_guitar_nylon'
  | 'acoustic_guitar_steel'
  | 'agogo'
  | 'alto_sax'
  | 'applause'
  | 'bagpipe'
  | 'banjo'
  | 'baritone_sax'
  | 'bassoon'
  | 'bird_tweet'
  | 'blown_bottle'
  | 'brass_section'
  | 'breath_noise'
  | 'bright_acoustic_piano'
  | 'celesta'
  | 'cello'
  | 'choir_aahs'
  | 'church_organ'
  | 'clarinet'
  | 'clavinet'
  | 'contrabass'
  | 'distortion_guitar'
  | 'drawbar_organ'
  | 'dulcimer'
  | 'electric_bass_finger'
  | 'electric_bass_pick'
  | 'electric_grand_piano'
  | 'electric_guitar_clean'
  | 'electric_guitar_jazz'
  | 'electric_guitar_muted'
  | 'electric_piano_1'
  | 'electric_piano_2'
  | 'english_horn'
  | 'fiddle'
  | 'flute'
  | 'french_horn'
  | 'fretless_bass'
  | 'fx_1_rain'
  | 'fx_2_soundtrack'
  | 'fx_3_crystal'
  | 'fx_4_atmosphere'
  | 'fx_5_brightness'
  | 'fx_6_goblins'
  | 'fx_7_echoes'
  | 'fx_8_scifi'
  | 'glockenspiel'
  | 'guitar_fret_noise'
  | 'guitar_harmonics'
  | 'gunshot'
  | 'harmonica'
  | 'harpsichord'
  | 'helicopter'
  | 'honkytonk_piano'
  | 'kalimba'
  | 'koto'
  | 'lead_1_square'
  | 'lead_2_sawtooth'
  | 'lead_3_calliope'
  | 'lead_4_chiff'
  | 'lead_5_charang'
  | 'lead_6_voice'
  | 'lead_7_fifths'
  | 'lead_8_bass__lead'
  | 'marimba'
  | 'melodic_tom'
  | 'music_box'
  | 'muted_trumpet'
  | 'oboe'
  | 'ocarina'
  | 'orchestra_hit'
  | 'orchestral_harp'
  | 'overdriven_guitar'
  | 'pad_1_new_age'
  | 'pad_2_warm'
  | 'pad_3_polysynth'
  | 'pad_4_choir'
  | 'pad_5_bowed'
  | 'pad_6_metallic'
  | 'pad_7_halo'
  | 'pad_8_sweep'
  | 'pan_flute'
  | 'percussive_organ'
  | 'piccolo'
  | 'pizzicato_strings'
  | 'recorder'
  | 'reed_organ'
  | 'reverse_cymbal'
  | 'rock_organ'
  | 'seashore'
  | 'shakuhachi'
  | 'shamisen'
  | 'shanai'
  | 'sitar'
  | 'slap_bass_1'
  | 'slap_bass_2'
  | 'soprano_sax'
  | 'steel_drums'
  | 'string_ensemble_1'
  | 'string_ensemble_2'
  | 'synth_bass_1'
  | 'synth_bass_2'
  | 'synth_brass_1'
  | 'synth_brass_2'
  | 'synth_choir'
  | 'synth_drum'
  | 'synth_strings_1'
  | 'synth_strings_2'
  | 'taiko_drum'
  | 'tango_accordion'
  | 'telephone_ring'
  | 'tenor_sax'
  | 'timpani'
  | 'tinkle_bell'
  | 'tremolo_strings'
  | 'trombone'
  | 'trumpet'
  | 'tuba'
  | 'tubular_bells'
  | 'vibraphone'
  | 'viola'
  | 'violin'
  | 'voice_oohs'
  | 'whistle'
  | 'woodblock'
  | 'xylophone';

interface Options {
  soundfont: 'FluidR3_GM' | 'MusyngKite';
  format?: 'ogg' | 'mp3';
}

interface SoundfontError {
  type: 'error';
  message: string;
}

interface SoundfontSuccess {
  type: 'success';
  buffers: { [k: number]: AudioBuffer };
}

export async function loadSoundfont(
  ac: AudioContext,
  name: string,
  options: Partial<Options> = {},
): Promise<SoundfontError | SoundfontSuccess> {
  const sf = options.soundfont ?? 'MusyngKite';
  const format = options.format ?? 'mp3';
  const url = 'https://gleitz.github.io/midi-js-soundfonts/' + sf + '/' + name + '-' + format + '.js';
  const response = await sendRequest(url);
  if (response.type === 'error') {
    return response;
  }

  let begin = response.body.indexOf('MIDI.Soundfont.');
  if (begin < 0) { throw Error('Invalid MIDI.js Soundfont format'); }
  begin = response.body.indexOf('=', begin) + 2;
  const end = response.body.lastIndexOf(',');
  const source: { [k: string]: string } =  JSON.parse(response.body.slice(begin, end) + '}');

  const buffers: { [k: number]: AudioBuffer } = {};

  try {
    Promise.all(Object.keys(source).map(async (key) => {
      const i = source[key].indexOf(',');
      const note = parseNote(key);
      if (note === undefined) {
        throw Error('Unable to parse note: ' + key);
      }

      buffers[note] = await decode(base64Decode(source[key].slice(i + 1)).buffer);
    }));
  } catch (e) {
    return {
      type: 'error',
      message: e.message,
    };
  }

  // Play doesn't handle cents
  // See https://github.com/danigb/sample-player/blob/master/lib/notes.js

  return {
    type: 'success',
    buffers,
  };
}

// tslint:disable-next-line:no-empty-interface
export interface SoundfontOptions {
  gain: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export const genId = ((i) => () => i++)(0);

/**
 * A soundfont source.
 */
export class Soundfont implements Source<SoundfontOptions> {
  // private player: soundfonts.Player | null = null;
  private out = context.createGain();
  private buffers: { [k: string]: AudioBuffer } | null = null;
  private defaults: SoundfontOptions = {
    attack: 0.01,
    decay: 0.1,
    sustain: 0.9,
    release: 0.3,
    gain: 1,
  };

  constructor(private name: SoundfontName) {
    this.attemptReloadIfNecessary();
  }

  public triggerAttackRelease(note: string, duration: Seconds, time: ContextTime, velocity?: number) {
    this.start(note, time, {
      duration,
      gain: velocity,
    });

    return this;
  }

  public triggerAttack(note: string, time?: Seconds, velocity?: number) {
    return this.start(note, time, { gain: velocity });
  }

  public connect(node: Tone.AudioNode): this {
    // A bit of a hacky solution to make Tone.js work with soundfonts
    this.out.connect((node as any).output as AudioNode);
    return this;
  }

  public disconnect(node: Tone.AudioNode) {
    // FIXME A bit of a hacky solution to make Tone.js work with soundfonts
    this.out.disconnect((node as any).output as AudioNode);
    return this;
  }

  public set<K extends keyof SoundfontOptions>(o: { key: K, value: SoundfontOptions[K] }) {
    this.defaults[o.key] = o.value;
  }

  public attemptReloadIfNecessary() {
    if (this.buffers === null) {
      const promise = loadSoundfont(context, this.name);

      promise.then((result) => {
        if (result.type === 'error') {
          // TODO
          // tslint:disable-next-line:no-console
          console.warn(result);
        } else {
          this.buffers = result.buffers;
        }
      });
    }
  }

  private start(name: string, when?: number, o: Partial<{ duration: number } & SoundfontOptions> = {}) {
    const midi = parseNote(name);
    if (midi === undefined || !this.buffers) {
      return {
        dispose: () => {
          //
        },
      };
    }

    when = when ?? context.currentTime;

    const buffer = this.buffers[midi];
    const node = this.createNode(buffer, o);
    node.env.start(when);
    node.source.start(when);

    if (o.duration) {
      node.stop(when + o.duration);
    }

    return node;
  }

  private createNode(buffer: AudioBuffer, o: Partial<SoundfontOptions>) {
    const node = context.createGain();
    node.gain.value = 0; // the envelope will control the gain
    node.connect(this.out);

    const env = new ADSR(context, {
      attackTime: o.attack ?? this.defaults.attack,
      decayTime: o.decay ?? this.defaults.decay,
      sustainLevel: o.sustain ?? this.defaults.sustain,
      releaseTime: o.release ?? this.defaults.release,
    });

    env.connect(node.gain);

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(node);
    // source.playbackRate.value = centsToRate(options.cents);

    const stop = (when?: number) => {
      const time = when ?? context.currentTime;

      env.stop(time);
      source.stop(time);
    };

    source.onended = () => {
      source.disconnect();
      // This api is not provided
      // I'm wondering if this will cause a bug or memory issue
      // env.disconnect();
      node.disconnect();
    };

    return {
      node,
      source,
      env,
      stop,
      dispose: () => {
        source.stop();
      },
    };
  }
}
