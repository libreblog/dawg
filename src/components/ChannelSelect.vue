<template>
  <drag-element
    class="flex justify-center bg-default rounded w-10" 
    cursor="ns-resize"
    @move="move"
    @scrol-move="scrollMove"
  >
    <div
      style="line-height: 38px"
      class="text-default select-none"
    >
      {{ display }}
    </div>
  </drag-element>
</template>

<script lang="ts">
import { ref, computed, createComponent } from '@vue/composition-api';

export default createComponent({
  name: 'ChannelSelect',
  props: {
    value: Number as () => number | undefined,
  },
  setup(props, context) {
    const factor = ref(0.2);
    const leftover = ref(0);

    const display = computed(() => {
      return props.value === undefined ? '——' : props.value;
    });

    function move(e: MouseEvent) {
      const current = props.value === undefined ? -1 : props.value;
      const goingUp = e.movementY < 0;
      const mouvement = Math.abs(e.movementY) * factor.value + leftover.value;
      leftover.value = mouvement % 1;

      const newValue = goingUp ? current + Math.floor(mouvement) : current - Math.floor(mouvement);
      if (newValue < 0) {
        context.emit('input', undefined);
      } else {
        context.emit('input', Math.min(newValue, 9));
      }
    }

    function scrollMove({ y }: { y: number }) {
      const current = props.value === undefined ? -1 : props.value;
      const newValue = current + y;
      if (newValue < 0) {
        context.emit('input', undefined);
      } else {
        context.emit('input', Math.min(newValue, 9));
      }
    }

    return {
      move,
      scrollMove,
      display,
    };
  },
});
</script>
