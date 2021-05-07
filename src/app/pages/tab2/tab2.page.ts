import { Component, OnInit } from '@angular/core';
import { DataService } from '../../services/data.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
})
export class Tab2Page implements OnInit {

  private hilo: any = null;
  horaGlobal: Date = new Date();

  noRepartidores: number = 0;
  repartidores: any[] = [];
  horarios: any[] = [];

  repartidorActual = {};
  repartidorDesasignadoActual = {};

  constructor(private dataService: DataService, private alertCtrl: AlertController) {}

  ngOnInit(): void {
    this.obtenerUsuarios();
    this.obtenerHorarios();
    this.hilo = setInterval(() =>{this.cuerpoHilo();},5000);
  }

  ngOnDestroy(): void {
		clearInterval(this.hilo);
	}

  cuerpoHilo(){
    this.horaGlobal = new Date();
    // repartidor.tiempo_restante + ':' + horaGlobal.getHours() + ':' + horaGlobal.getMinutes()
    this.horarios.forEach(horario => {
        horario.motoristas.forEach( asignado => {
          let [hours,minutes] = asignado.hora_asignado.split(':');
          let hora_g = this.horaGlobal.getHours();
          let minuto_g = this.horaGlobal.getMinutes();
          let horas_trans = 0;
          let minutos_trans = 0;

          horas_trans = hora_g - hours;
          if (horas_trans != 0) {
            horas_trans = 0;
            minutos_trans = (60 - minutes) + minuto_g;
          }else{
            minutos_trans = minuto_g - minutes;
          }
          asignado.tiempo_transcurrido = horas_trans + ':' + minutos_trans
          if (minutos_trans >= 30) {
            this.desasignaMotorista(asignado._id, horario._id);
          }
          //console.log("HORA ACTUAL: ", hora_g, ':', minuto_g);
          //console.log("HORA ASIGNADO: ", hours, ':', minutes);
        });
    });
  }

  obtenerUsuarios() {
    this.dataService.obtenerUsuarios().subscribe((resp: any) => {
      this.repartidores = resp;
      this.conteoMotoristasDisponible();
    });
  }

  obtenerHorarios() {
    this.dataService.obtenerHorarios().subscribe((resp: any) => {
      this.horarios = resp;
      console.log(this.horarios);
    });
  }

  conteoMotoristasDisponible() {
    const filtrados = this.repartidores.filter(
      (repartidor) => repartidor.estado === 'success'
    );
    this.noRepartidores = filtrados.length;
  }

  asignaMotorista(horario_inicio, horario_fin) {
    //Si es asignable
    if(this.compararHoras(horario_inicio,horario_fin)){
      this.validaAsignaMotorista(horario_inicio);
    }else{
      this.presentAlert('Horario no coincide con la hora actual');
    }

  }

  validaAsignaMotorista(horario_inicio) {

    // asigna
    if (this.noRepartidores > 0) {
      this.noRepartidores--;
      this.asignaEstadoMotorista('success');
    } else {
      this.presentAlert('No quedan motoristas disponibles');
      return;
    }

    this.asignaHorario(horario_inicio);
  }

  desasignaMotorista(id_repartidor, id_horario) {
    this.validaDesasignaMotorista(id_repartidor, id_horario);
  }

  validaDesasignaMotorista(repartidor_id, horario_id) {

    if (this.noRepartidores < 8) {
      this.noRepartidores++;
      this.desasignaEstadoMotorista(repartidor_id);
    } else {
      alert('No hay más motoristas');
      return;
    }

    this.desasignaHorario(repartidor_id, horario_id);
  }

  asignaHorario(hora_inicio) {
    var indiceMatch;
    for (var indice in this.horarios) {
      var inicio = this.horarios[indice].hora_inicio;
      if (inicio == hora_inicio) {
        indiceMatch = indice;
      }
    }

    this.repartidorActual['hora_asignado'] = this.horaActual();
    this.repartidorActual['tiempo_transcurrido'] = "00:00";
    this.horarios[indiceMatch].motoristas.push(this.repartidorActual);
    console.log(this.horarios[indiceMatch]);
    console.log(this.repartidores);
    this.dataService
      .actualizaHorario(this.horarios[indiceMatch])
      .subscribe((resp) => {
        console.log(resp);
      });
  }


  desasignaHorario(repartidor_id, horario_id) {
    var indiceMatch;
    for (var indice in this.horarios) {
      var id_h = this.horarios[indice]._id;
      if (id_h == horario_id) {
        indiceMatch = indice;
      }
    }

    var indiceRepartidores;
    for (var indice2 in this.horarios[indiceMatch].motoristas) {
      var id_r = this.horarios[indiceMatch].motoristas[indice2]._id;
      if (id_r == repartidor_id) {
        indiceRepartidores = indice2;
      }
    }

    this.horarios[indiceMatch].motoristas.splice(indiceRepartidores,1);;
    console.log(this.horarios[indiceMatch]);
    console.log(this.repartidores);
    this.dataService
      .actualizaHorario(this.horarios[indiceMatch])
      .subscribe((resp) => {
        console.log(resp);
        this.presentAlert('Motorista desasignado');
      });
  }

  asignaEstadoMotorista(estado) {
    const filtrados = this.repartidores.filter(
      (repartidor) => repartidor.estado === estado
    );
    //this.repartidorActual tiene el repartidor que vamos a cambiar de estado
    this.repartidorActual = filtrados[0];
    this.dataService
      .actualizaDisponibilidadRepartidor(this.repartidorActual)
      .subscribe((resp) => {
        console.log(resp);
      });
  }

  desasignaEstadoMotorista(id_repartidor) {
    const filtrados = this.repartidores.filter(
      (repartidor) => repartidor._id === id_repartidor
    );
    this.repartidorDesasignadoActual = filtrados[0];
    this.dataService
      .actualizaDisponibilidadRepartidor(this.repartidorDesasignadoActual)
      .subscribe((resp) => {
        console.log(resp);
      });
  }


  buscaAlQueAsigna() {
    const filtrados = this.repartidores.filter(
      (repartidor) => repartidor.estado === 'success'
    );
    const repartidor = filtrados[0];
    return repartidor;
  }

  horaActual() {
    const hoy = new Date();
    return hoy.getHours() + ':' + hoy.getMinutes();
  }

  async presentAlert(mensaje) {
    const alert = await this.alertCtrl.create({
      backdropDismiss: false,
      header: 'Atención',
      message: mensaje,
      buttons: ['OK']
    });

    await alert.present();

    const { role } = await alert.onDidDismiss();
    console.log('onDidDismiss resolved with role', role);
  }

  compararHoras(hora_inicio, hora_final): boolean{
    let inicio = new Date();
    let [hours1, minutes1] = hora_inicio.split(':');
    inicio.setHours(+hours1);
    inicio.setMinutes(minutes1);

    let fin = new Date();
    let [hours2, minutes2] = hora_final.split(':');
    fin.setHours(+hours2);
    fin.setMinutes(minutes2);

    let hoy = new Date();

    return ( (inicio.getTime() < hoy.getTime()) && (hoy.getTime() < fin.getTime()))
  }


}
