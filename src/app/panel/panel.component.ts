import { Component, inject, signal } from '@angular/core';
import { AMBITOS, CATEGORIAS, colorDe } from '../core/lugar.model';
import { LugaresStore } from '../core/lugares.store';

@Component({
  selector: 'app-panel',
  templateUrl: './panel.component.html',
  host: { class: 'panel' },
})
export class PanelComponent {
  protected readonly store = inject(LugaresStore);
  protected readonly categorias = CATEGORIAS;
  protected readonly ambitos = AMBITOS;
  protected readonly colorDe = colorDe;
  protected readonly plegado = signal(false);

  protected buscar(evento: Event): void {
    this.store.busqueda.set((evento.target as HTMLInputElement).value);
  }
}
